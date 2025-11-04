/**
 * Signal Protocol Key Manager
 * 
 * Handles automatic key generation, upload to server, and key lifecycle management.
 * This module is responsible for ensuring every user has Signal Protocol keys set up.
 */

import * as SignalProtocol from './signalProtocol';
import * as KeyStorage from './keyStorage';

const PREKEY_REPLENISH_THRESHOLD = 10; // Replenish when below 10 prekeys

/**
 * Initialize Signal Protocol keys for a new user
 * Generates all necessary keys and uploads public keys to server
 */
export async function initializeSignalKeys(): Promise<void> {
  console.log('Initializing Signal Protocol keys...');
  
  try {
    // Generate all Signal Protocol keys using the existing function
    const keys = await SignalProtocol.initializeSignalKeys();
    console.log('✓ Generated all Signal Protocol keys');
    
    // Store all keys locally (private keys stay in IndexedDB)
    await KeyStorage.storeSignalKeys(keys);
    console.log('✓ Stored keys in secure IndexedDB storage');
    
    // Upload public keys to server
    await uploadPublicKeys(keys);
    console.log('✓ Uploaded public keys to server');
    
    console.log('✅ Signal Protocol initialization complete');
  } catch (error) {
    console.error('Failed to initialize Signal Protocol keys:', error);
    throw error;
  }
}

/**
 * Upload public keys to server
 * Only public keys are sent - private keys never leave the client
 */
async function uploadPublicKeys(keys: SignalProtocol.StoredKeys): Promise<void> {
  const payload = {
    identityKey: keys.identityKeyPair.publicKey,
    signedPreKey: {
      keyId: keys.signedPreKey.keyId.toString(),
      publicKey: keys.signedPreKey.publicKey,
      signature: keys.signedPreKey.signature,
    },
    preKeys: keys.preKeys.map(pk => ({
      keyId: pk.keyId.toString(),
      publicKey: pk.publicKey,
    })),
  };
  
  const response = await fetch('/api/signal/keys', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to upload public keys');
  }
}

/**
 * Ensure user has Signal Protocol keys initialized
 * Called automatically on app load for authenticated users
 */
export async function ensureSignalKeysExist(): Promise<boolean> {
  try {
    // Check if keys already exist locally
    const hasKeys = await KeyStorage.hasSignalKeys();
    
    if (!hasKeys) {
      console.log('No Signal Protocol keys found, initializing...');
      await initializeSignalKeys();
      return true;
    }
    
    console.log('Signal Protocol keys already exist');
    
    // Check if we need to replenish prekeys
    await checkAndReplenishPrekeys();
    
    return false; // Keys already existed
  } catch (error) {
    console.error('Failed to ensure Signal keys exist:', error);
    throw error;
  }
}

/**
 * Check prekey count and replenish if below threshold
 */
async function checkAndReplenishPrekeys(): Promise<void> {
  const count = await KeyStorage.getUnusedPrekeysCount();
  
  if (count < PREKEY_REPLENISH_THRESHOLD) {
    console.log(`Prekey count (${count}) below threshold, replenishing...`);
    await replenishPrekeys();
  }
}

/**
 * Generate and upload new prekeys
 */
async function replenishPrekeys(): Promise<void> {
  try {
    // Get existing keys to determine next keyId
    const existingKeys = await KeyStorage.getSignalKeys();
    if (!existingKeys) {
      throw new Error('Cannot replenish prekeys: no existing keys found');
    }
    
    // Find highest keyId
    const maxKeyId = existingKeys.preKeys.reduce(
      (max, pk) => Math.max(max, pk.keyId),
      0
    );
    
    // Generate new prekeys starting from maxKeyId + 1
    const newPreKeysRaw = await SignalProtocol.generatePreKeys(
      maxKeyId + 1,
      100
    );
    
    // Serialize the new prekeys
    const newPreKeys = newPreKeysRaw.map(pk => ({
      keyId: pk.keyId,
      publicKey: SignalProtocol.serializePublicKey(pk.publicKey),
      privateKey: SignalProtocol.serializePrivateKey(pk.privateKey),
    }));
    
    // Add to existing prekeys
    const updatedPreKeys = [
      ...existingKeys.preKeys,
      ...newPreKeys,
    ];
    
    // Update local storage
    existingKeys.preKeys = updatedPreKeys;
    await KeyStorage.storeSignalKeys(existingKeys);
    
    // Upload public keys to server
    const response = await fetch('/api/signal/keys/replenish', {
      method: 'POST',
      body: JSON.stringify({
        preKeys: newPreKeys.map(pk => ({
          keyId: pk.keyId.toString(),
          publicKey: pk.publicKey,
        })),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to replenish prekeys');
    }
    
    console.log(`✓ Replenished ${newPreKeys.length} prekeys`);
  } catch (error) {
    console.error('Failed to replenish prekeys:', error);
    throw error;
  }
}

/**
 * Get prekey bundle for another user from server
 * Used to establish an encrypted session with a recipient
 */
export async function fetchPrekeyBundle(userId: string): Promise<{
  identityKey: string;
  signedPreKey: {
    keyId: string;
    publicKey: string;
    signature: string;
  };
  preKey: {
    keyId: string;
    publicKey: string;
  } | null;
}> {
  const response = await fetch(`/api/signal/keys/${userId}`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch prekey bundle');
  }
  
  return await response.json();
}

/**
 * Reset all Signal Protocol keys (use with caution!)
 * This will break all existing sessions and require re-establishing encryption
 */
export async function resetSignalKeys(): Promise<void> {
  console.warn('Resetting all Signal Protocol keys...');
  
  // Clear local storage
  await KeyStorage.clearAllSignalData();
  
  // Generate and upload new keys
  await initializeSignalKeys();
  
  console.log('✓ Signal Protocol keys reset complete');
}

/**
 * Get safety number for verifying identity with another user
 */
export async function getSafetyNumber(
  myUserId: string,
  theirUserId: string,
  theirIdentityKey: string
): Promise<string> {
  const myKeys = await KeyStorage.getSignalKeys();
  if (!myKeys) {
    throw new Error('No local keys found');
  }
  
  return SignalProtocol.calculateSafetyNumber(
    myKeys.identityKeyPair.publicKey,
    myUserId,
    theirIdentityKey,
    theirUserId
  );
}
