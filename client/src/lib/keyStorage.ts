/**
 * Secure Key Storage using IndexedDB with WebCrypto encryption
 * 
 * Stores Signal Protocol private keys encrypted in the browser's IndexedDB.
 * Private keys are encrypted using AES-GCM with a non-extractable CryptoKey.
 * Private keys NEVER leave the client - only public keys are sent to server.
 */

const DB_NAME = 'lockbox-signal-keys';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const CRYPTO_KEY_NAME = 'lockbox-encryption-key';

interface StoredKeyData {
  key: string;
  value: string; // Encrypted data (base64)
  iv: string; // Initialization vector (base64)
  timestamp: number;
}

class KeyStorage {
  private db: IDBDatabase | null = null;
  private cryptoKey: CryptoKey | null = null;

  /**
   * Initialize IndexedDB database and crypto key
   */
  async init(): Promise<void> {
    // Initialize database
    await this.initDatabase();
    
    // Initialize or retrieve encryption key
    await this.initCryptoKey();
  }

  /**
   * Initialize IndexedDB database
   */
  private async initDatabase(): Promise<void> {
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
   * Initialize or derive encryption key from passphrase
   * Uses PBKDF2 with a salt stored in IndexedDB for key derivation
   * IMPORTANT: This requires a user passphrase - must be set before use
   */
  private async initCryptoKey(): Promise<void> {
    // Check if we have a stored salt (indicates key was previously set up)
    const storedSaltData = await this.getItemRaw('__crypto_salt__');
    
    if (storedSaltData) {
      // We have a salt, so we need a passphrase to derive the key
      // For now, we'll use a session-based derivation that doesn't require re-entering password
      // This is a temporary solution - in production, you'd require user password on each session
      
      // SECURITY NOTE: This approach still has limitations for browser-based E2E encryption
      // Without user password on every session, we can't protect against XSS/malicious scripts
      // This provides defense-in-depth but is not true E2E encryption
      
      // For now, derive from a browser-stored entropy + salt
      // In production, this should be replaced with user passphrase
      const browserEntropy = await this.getBrowserEntropy();
      const salt = this.base64ToBuffer(storedSaltData.value);
      
      this.cryptoKey = await this.deriveKeyFromPassphrase(browserEntropy, salt);
    } else {
      // First time setup - generate new salt and derive key
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const browserEntropy = await this.getBrowserEntropy();
      
      // Store the salt (not sensitive - used for key derivation)
      await this.setItemRaw('__crypto_salt__', this.bufferToBase64(salt), new Uint8Array(12));
      
      // Derive encryption key from entropy + salt
      this.cryptoKey = await this.deriveKeyFromPassphrase(browserEntropy, salt);
    }
  }

  /**
   * Get or generate browser-specific entropy for key derivation
   * SECURITY NOTE: This is stored in localStorage and provides basic obfuscation
   * In production, this should be replaced with user-entered passphrase
   */
  private async getBrowserEntropy(): Promise<string> {
    const ENTROPY_KEY = 'lockbox_key_entropy';
    
    let entropy = localStorage.getItem(ENTROPY_KEY);
    if (!entropy) {
      // Generate new entropy
      const randomBytes = crypto.getRandomValues(new Uint8Array(32));
      entropy = this.bufferToBase64(randomBytes);
      localStorage.setItem(ENTROPY_KEY, entropy);
    }
    
    return entropy;
  }

  /**
   * Derive a CryptoKey from a passphrase using PBKDF2
   */
  private async deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    // Convert passphrase to key material
    const encoder = new TextEncoder();
    const passphraseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive the actual encryption key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // High iteration count for security
        hash: 'SHA-256',
      },
      passphraseKey,
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  }

  /**
   * Ensure database and crypto key are initialized
   */
  private async ensureInit(): Promise<void> {
    if (!this.db || !this.cryptoKey) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize key storage database');
    }
    if (!this.cryptoKey) {
      throw new Error('Failed to initialize encryption key');
    }
  }

  /**
   * Utility: Convert buffer to base64
   */
  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert base64 to buffer
   */
  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Encrypt data using WebCrypto AES-GCM
   */
  private async encrypt(data: string): Promise<{ encrypted: string; iv: string }> {
    if (!this.cryptoKey) {
      throw new Error('Crypto key not initialized');
    }

    // Generate a random IV for this encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Convert string to buffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.cryptoKey,
      dataBuffer
    );
    
    return {
      encrypted: this.bufferToBase64(encryptedBuffer),
      iv: this.bufferToBase64(iv),
    };
  }

  /**
   * Decrypt data using WebCrypto AES-GCM
   */
  private async decrypt(encrypted: string, ivBase64: string): Promise<string> {
    if (!this.cryptoKey) {
      throw new Error('Crypto key not initialized');
    }

    const encryptedBuffer = this.base64ToBuffer(encrypted);
    const iv = this.base64ToBuffer(ivBase64);
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.cryptoKey,
      encryptedBuffer
    );
    
    // Convert buffer to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Store a key-value pair (unencrypted, for internal use only)
   */
  private async setItemRaw(key: string, value: string, iv: Uint8Array): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data: StoredKeyData = {
        key,
        value,
        iv: this.bufferToBase64(iv),
        timestamp: Date.now(),
      };
      
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve a value by key (unencrypted, for internal use only)
   */
  private async getItemRaw(key: string): Promise<StoredKeyData | null> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result as StoredKeyData | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store a key-value pair (encrypted)
   */
  async setItem(key: string, value: string): Promise<void> {
    await this.ensureInit();
    
    // Encrypt the value
    const { encrypted, iv } = await this.encrypt(value);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data: StoredKeyData = {
        key,
        value: encrypted,
        iv,
        timestamp: Date.now(),
      };
      
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve and decrypt a value by key
   */
  async getItem(key: string): Promise<string | null> {
    await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = async () => {
        const result = request.result as StoredKeyData | undefined;
        if (!result) {
          resolve(null);
          return;
        }
        
        try {
          // Decrypt the value
          const decrypted = await this.decrypt(result.value, result.iv);
          resolve(decrypted);
        } catch (error) {
          reject(new Error('Failed to decrypt stored data'));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove a key-value pair
   */
  async removeItem(key: string): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all stored keys (including the crypto key!)
   * Use with extreme caution - this will destroy all encryption keys
   */
  async clear(): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => {
        // Reset crypto key after clearing
        this.cryptoKey = null;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
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
    publicKey: ArrayBuffer;
    privateKey: ArrayBuffer;
  };
  registrationId: number;
  signedPreKey: {
    keyId: number;
    keyPair: {
      publicKey: ArrayBuffer;
      privateKey: ArrayBuffer;
    };
    signature: ArrayBuffer;
  };
  preKeys: Array<{
    keyId: number;
    keyPair: {
      publicKey: ArrayBuffer;
      privateKey: ArrayBuffer;
    };
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
 * Helper: Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Convert base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Store Signal Protocol keys
 */
export async function storeSignalKeys(keys: SignalKeySet): Promise<void> {
  await keyStorage.init();
  
  // Store identity key pair (convert ArrayBuffer to base64)
  await keyStorage.setItem(KEYS.IDENTITY_PRIVATE_KEY, arrayBufferToBase64(keys.identityKeyPair.privateKey));
  await keyStorage.setItem(KEYS.IDENTITY_PUBLIC_KEY, arrayBufferToBase64(keys.identityKeyPair.publicKey));
  
  // Store registration ID
  await keyStorage.setItem(KEYS.REGISTRATION_ID, keys.registrationId.toString());
  
  // Store signed prekey (convert ArrayBuffers to base64)
  const signedPreKeyForStorage = {
    keyId: keys.signedPreKey.keyId,
    keyPair: {
      publicKey: arrayBufferToBase64(keys.signedPreKey.keyPair.publicKey),
      privateKey: arrayBufferToBase64(keys.signedPreKey.keyPair.privateKey),
    },
    signature: arrayBufferToBase64(keys.signedPreKey.signature),
  };
  await keyStorage.setItem(KEYS.SIGNED_PREKEY, JSON.stringify(signedPreKeyForStorage));
  
  // Store prekeys (convert ArrayBuffers to base64)
  const preKeysForStorage = keys.preKeys.map(pk => ({
    keyId: pk.keyId,
    keyPair: {
      publicKey: arrayBufferToBase64(pk.keyPair.publicKey),
      privateKey: arrayBufferToBase64(pk.keyPair.privateKey),
    },
  }));
  await keyStorage.setItem(KEYS.PREKEYS, JSON.stringify(preKeysForStorage));
}

/**
 * Retrieve Signal Protocol keys
 */
export async function getSignalKeys(): Promise<SignalKeySet | null> {
  await keyStorage.init();
  
  const privateKeyB64 = await keyStorage.getItem(KEYS.IDENTITY_PRIVATE_KEY);
  const publicKeyB64 = await keyStorage.getItem(KEYS.IDENTITY_PUBLIC_KEY);
  const regIdStr = await keyStorage.getItem(KEYS.REGISTRATION_ID);
  const signedPreKeyStr = await keyStorage.getItem(KEYS.SIGNED_PREKEY);
  const preKeysStr = await keyStorage.getItem(KEYS.PREKEYS);
  
  if (!privateKeyB64 || !publicKeyB64 || !regIdStr || !signedPreKeyStr || !preKeysStr) {
    return null;
  }
  
  // Parse stored data
  const signedPreKeyStored = JSON.parse(signedPreKeyStr);
  const preKeysStored = JSON.parse(preKeysStr);
  
  // Convert base64 back to ArrayBuffer
  return {
    identityKeyPair: {
      publicKey: base64ToArrayBuffer(publicKeyB64),
      privateKey: base64ToArrayBuffer(privateKeyB64),
    },
    registrationId: parseInt(regIdStr, 10),
    signedPreKey: {
      keyId: signedPreKeyStored.keyId,
      keyPair: {
        publicKey: base64ToArrayBuffer(signedPreKeyStored.keyPair.publicKey),
        privateKey: base64ToArrayBuffer(signedPreKeyStored.keyPair.privateKey),
      },
      signature: base64ToArrayBuffer(signedPreKeyStored.signature),
    },
    preKeys: preKeysStored.map((pk: any) => ({
      keyId: pk.keyId,
      keyPair: {
        publicKey: base64ToArrayBuffer(pk.keyPair.publicKey),
        privateKey: base64ToArrayBuffer(pk.keyPair.privateKey),
      },
    })),
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
