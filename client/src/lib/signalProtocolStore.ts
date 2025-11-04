import {
  SignalProtocolAddress,
  SessionRecordType,
  Direction,
  KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';
import * as KeyStorage from './keyStorage';

/**
 * SignalProtocolStore Implementation
 * 
 * This implements the storage interface required by the Signal Protocol library.
 * All data is stored in encrypted IndexedDB for security.
 * 
 * The store manages:
 * - Identity keys (our key pair + trusted remote identity keys)
 * - Prekeys (one-time keys for session establishment)
 * - Signed prekeys (authenticated prekeys)
 * - Sessions (encrypted session state with each contact)
 */

const DB_NAME = 'signalProtocolStore';
const DB_VERSION = 1;

interface StoreData {
  identityKeyPair?: KeyPairType<ArrayBuffer>;
  registrationId?: number;
  trustedKeys: Map<string, ArrayBuffer>; // address -> identity key
  sessions: Map<string, SessionRecordType>; // address -> session
  preKeys: Map<number, KeyPairType<ArrayBuffer>>;
  signedPreKeys: Map<number, {
    keyPair: KeyPairType<ArrayBuffer>;
    signature: ArrayBuffer;
  }>;
}

export class SignalProtocolStore {
  private dbPromise: Promise<IDBDatabase>;
  private data: StoreData = {
    trustedKeys: new Map(),
    sessions: new Map(),
    preKeys: new Map(),
    signedPreKeys: new Map(),
  };

  constructor() {
    this.dbPromise = this.initDB();
    this.loadFromStorage();
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions');
        }
        if (!db.objectStoreNames.contains('identityKeys')) {
          db.createObjectStore('identityKeys');
        }
      };
    });
  }

  private async loadFromStorage(): Promise<void> {
    try {
      // Load our identity key pair from secure storage
      const keys = await KeyStorage.getSignalKeys();
      if (keys) {
        // Convert to KeyPairType format (pubKey/privKey)
        this.data.identityKeyPair = {
          pubKey: keys.identityKeyPair.publicKey,
          privKey: keys.identityKeyPair.privateKey,
        };
        this.data.registrationId = keys.registrationId;

        // Load prekeys
        keys.preKeys.forEach((pk: any) => {
          this.data.preKeys.set(pk.keyId, {
            pubKey: pk.keyPair.publicKey,
            privKey: pk.keyPair.privateKey,
          });
        });

        // Load signed prekey
        this.data.signedPreKeys.set(
          keys.signedPreKey.keyId,
          {
            keyPair: {
              pubKey: keys.signedPreKey.keyPair.publicKey,
              privKey: keys.signedPreKey.keyPair.privateKey,
            },
            signature: keys.signedPreKey.signature,
          }
        );
      }

      // Load sessions from IndexedDB
      const db = await this.dbPromise;
      const tx = db.transaction(['sessions'], 'readonly');
      const store = tx.objectStore('sessions');
      const request = store.getAll();

      request.onsuccess = () => {
        const sessions = request.result;
        sessions.forEach((session: any) => {
          this.data.sessions.set(session.address, session.record);
        });
      };
    } catch (error) {
      console.error('Failed to load Signal Protocol store data:', error);
    }
  }

  // ========== Identity Key Methods ==========

  async getIdentityKeyPair(): Promise<KeyPairType<ArrayBuffer> | undefined> {
    return this.data.identityKeyPair;
  }

  async getLocalRegistrationId(): Promise<number | undefined> {
    return this.data.registrationId;
  }

  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    direction: Direction
  ): Promise<boolean> {
    const trusted = this.data.trustedKeys.get(identifier);
    
    // If we haven't seen this identity before, trust it
    if (!trusted) {
      return true;
    }

    // Check if the key matches what we have stored
    return this.arrayBuffersEqual(trusted, identityKey);
  }

  async saveIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean> {
    const existing = this.data.trustedKeys.get(identifier);
    
    // Store the identity key
    this.data.trustedKeys.set(identifier, identityKey);

    // Save to IndexedDB
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(['identityKeys'], 'readwrite');
      const store = tx.objectStore('identityKeys');
      await store.put(identityKey, identifier);
    } catch (error) {
      console.error('Failed to save identity key:', error);
    }

    // Return true if this is a new identity or changed identity
    return !existing || !this.arrayBuffersEqual(existing, identityKey);
  }

  // ========== PreKey Methods ==========

  async loadPreKey(keyId: string | number): Promise<KeyPairType<ArrayBuffer> | undefined> {
    const id = typeof keyId === 'string' ? parseInt(keyId, 10) : keyId;
    return this.data.preKeys.get(id);
  }

  async storePreKey(keyId: string | number, keyPair: KeyPairType<ArrayBuffer>): Promise<void> {
    const id = typeof keyId === 'string' ? parseInt(keyId, 10) : keyId;
    this.data.preKeys.set(id, keyPair);
  }

  async removePreKey(keyId: string | number): Promise<void> {
    const id = typeof keyId === 'string' ? parseInt(keyId, 10) : keyId;
    this.data.preKeys.delete(id);
  }

  // ========== Signed PreKey Methods ==========

  async loadSignedPreKey(keyId: string | number): Promise<KeyPairType<ArrayBuffer> | undefined> {
    const id = typeof keyId === 'string' ? parseInt(keyId, 10) : keyId;
    const signedPreKey = this.data.signedPreKeys.get(id);
    if (!signedPreKey) return undefined;
    
    return signedPreKey.keyPair;
  }

  async storeSignedPreKey(
    keyId: string | number,
    keyPair: KeyPairType<ArrayBuffer>
  ): Promise<void> {
    const id = typeof keyId === 'string' ? parseInt(keyId, 10) : keyId;
    this.data.signedPreKeys.set(id, {
      keyPair,
      signature: new ArrayBuffer(0), // Signature is stored separately
    });
  }

  async removeSignedPreKey(keyId: string | number): Promise<void> {
    const id = typeof keyId === 'string' ? parseInt(keyId, 10) : keyId;
    this.data.signedPreKeys.delete(id);
  }

  // ========== Session Methods ==========

  async loadSession(identifier: string): Promise<SessionRecordType | undefined> {
    const addressString = identifier;
    return this.data.sessions.get(addressString);
  }

  async storeSession(identifier: string, record: SessionRecordType): Promise<void> {
    const addressString = identifier;
    this.data.sessions.set(addressString, record);

    // Persist to IndexedDB
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(['sessions'], 'readwrite');
      const store = tx.objectStore('sessions');
      await store.put({ address: addressString, record }, addressString);
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  async getDeviceIds(identifier: string): Promise<number[]> {
    const deviceIds: number[] = [];
    
    // Convert iterator to array to avoid downlevelIteration issue
    const keys = Array.from(this.data.sessions.keys());
    for (const key of keys) {
      const [storedIdentifier] = key.split('.');
      if (storedIdentifier === identifier) {
        const deviceId = parseInt(key.split('.')[1] || '1', 10);
        deviceIds.push(deviceId);
      }
    }

    return deviceIds;
  }

  // ========== Utility Methods ==========

  private arrayBuffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
    const viewA = new Uint8Array(a);
    const viewB = new Uint8Array(b);
    
    if (viewA.length !== viewB.length) return false;
    
    for (let i = 0; i < viewA.length; i++) {
      if (viewA[i] !== viewB[i]) return false;
    }
    
    return true;
  }

  /**
   * Get session state for a specific user (for UI display)
   */
  async hasSessionWith(userId: string): Promise<boolean> {
    const addressString = `${userId}.1`; // Default device ID is 1
    return this.data.sessions.has(addressString);
  }

  /**
   * Clear all sessions (for debugging or account reset)
   */
  async clearAllSessions(): Promise<void> {
    this.data.sessions.clear();
    
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(['sessions'], 'readwrite');
      const store = tx.objectStore('sessions');
      await store.clear();
    } catch (error) {
      console.error('Failed to clear sessions:', error);
    }
  }
}

// Singleton instance
let storeInstance: SignalProtocolStore | null = null;

export function getSignalProtocolStore(): SignalProtocolStore {
  if (!storeInstance) {
    storeInstance = new SignalProtocolStore();
  }
  return storeInstance;
}
