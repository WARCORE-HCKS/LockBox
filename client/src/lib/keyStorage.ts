/**
 * Secure Key Storage using IndexedDB
 * 
 * Stores Signal Protocol private keys securely in the browser's IndexedDB.
 * Private keys NEVER leave the client - only public keys are sent to server.
 */

const DB_NAME = 'lockbox-signal-keys';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

interface StoredKeyData {
  key: string;
  value: string;
  timestamp: number;
}

class KeyStorage {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize key storage database');
    }
    return this.db;
  }

  /**
   * Store a key-value pair
   */
  async setItem(key: string, value: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data: StoredKeyData = {
        key,
        value,
        timestamp: Date.now(),
      };
      
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve a value by key
   */
  async getItem(key: string): Promise<string | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result as StoredKeyData | undefined;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove a key-value pair
   */
  async removeItem(key: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all stored keys
   */
  async clear(): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const keyStorage = new KeyStorage();

/**
 * Signal Protocol Key Storage API
 * High-level interface for storing Signal Protocol keys
 */

export interface SignalKeySet {
  identityKeyPair: {
    publicKey: string;
    privateKey: string;
  };
  registrationId: number;
  signedPreKey: {
    keyId: number;
    publicKey: string;
    privateKey: string;
    signature: string;
  };
  preKeys: Array<{
    keyId: number;
    publicKey: string;
    privateKey: string;
  }>;
}

const KEYS = {
  IDENTITY_PRIVATE_KEY: 'signal:identity:privateKey',
  IDENTITY_PUBLIC_KEY: 'signal:identity:publicKey',
  REGISTRATION_ID: 'signal:registrationId',
  SIGNED_PREKEY: 'signal:signedPreKey',
  PREKEYS: 'signal:preKeys',
  SESSIONS_PREFIX: 'signal:session:',
};

/**
 * Store Signal Protocol keys
 */
export async function storeSignalKeys(keys: SignalKeySet): Promise<void> {
  await keyStorage.init();
  
  // Store identity key pair
  await keyStorage.setItem(KEYS.IDENTITY_PRIVATE_KEY, keys.identityKeyPair.privateKey);
  await keyStorage.setItem(KEYS.IDENTITY_PUBLIC_KEY, keys.identityKeyPair.publicKey);
  
  // Store registration ID
  await keyStorage.setItem(KEYS.REGISTRATION_ID, keys.registrationId.toString());
  
  // Store signed prekey
  await keyStorage.setItem(KEYS.SIGNED_PREKEY, JSON.stringify(keys.signedPreKey));
  
  // Store prekeys
  await keyStorage.setItem(KEYS.PREKEYS, JSON.stringify(keys.preKeys));
}

/**
 * Retrieve Signal Protocol keys
 */
export async function getSignalKeys(): Promise<SignalKeySet | null> {
  await keyStorage.init();
  
  const privateKey = await keyStorage.getItem(KEYS.IDENTITY_PRIVATE_KEY);
  const publicKey = await keyStorage.getItem(KEYS.IDENTITY_PUBLIC_KEY);
  const regIdStr = await keyStorage.getItem(KEYS.REGISTRATION_ID);
  const signedPreKeyStr = await keyStorage.getItem(KEYS.SIGNED_PREKEY);
  const preKeysStr = await keyStorage.getItem(KEYS.PREKEYS);
  
  if (!privateKey || !publicKey || !regIdStr || !signedPreKeyStr || !preKeysStr) {
    return null;
  }
  
  return {
    identityKeyPair: {
      publicKey,
      privateKey,
    },
    registrationId: parseInt(regIdStr, 10),
    signedPreKey: JSON.parse(signedPreKeyStr),
    preKeys: JSON.parse(preKeysStr),
  };
}

/**
 * Check if Signal keys exist
 */
export async function hasSignalKeys(): Promise<boolean> {
  await keyStorage.init();
  const privateKey = await keyStorage.getItem(KEYS.IDENTITY_PRIVATE_KEY);
  return privateKey !== null;
}

/**
 * Store a session with another user
 */
export async function storeSession(recipientId: string, sessionData: string): Promise<void> {
  await keyStorage.init();
  await keyStorage.setItem(`${KEYS.SESSIONS_PREFIX}${recipientId}`, sessionData);
}

/**
 * Retrieve a session with another user
 */
export async function getSession(recipientId: string): Promise<string | null> {
  await keyStorage.init();
  return await keyStorage.getItem(`${KEYS.SESSIONS_PREFIX}${recipientId}`);
}

/**
 * Delete a session with another user
 */
export async function deleteSession(recipientId: string): Promise<void> {
  await keyStorage.init();
  await keyStorage.removeItem(`${KEYS.SESSIONS_PREFIX}${recipientId}`);
}

/**
 * Clear all Signal Protocol data (use with caution!)
 */
export async function clearAllSignalData(): Promise<void> {
  await keyStorage.init();
  await keyStorage.clear();
}

/**
 * Get unused prekeys count
 */
export async function getUnusedPrekeysCount(): Promise<number> {
  const keys = await getSignalKeys();
  return keys?.preKeys.length || 0;
}

/**
 * Remove used prekey from storage
 */
export async function markPreKeyAsUsed(keyId: number): Promise<void> {
  const keys = await getSignalKeys();
  if (!keys) return;
  
  // Remove the used prekey
  keys.preKeys = keys.preKeys.filter(pk => pk.keyId !== keyId);
  
  // Update storage
  await keyStorage.setItem(KEYS.PREKEYS, JSON.stringify(keys.preKeys));
}
