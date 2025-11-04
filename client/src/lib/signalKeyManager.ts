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
    // Generate all Signal Protocol keys
    console.log('Step 1: Generating Signal Protocol keys...');
    const keys = await SignalProtocol.initializeSignalKeys();
    console.log('✓ Generated all Signal Protocol keys');
    
    // Store all keys locally (private keys stay in IndexedDB)
    console.log('Step 2: Storing keys in IndexedDB...');
    await KeyStorage.storeSignalKeys(keys);
    console.log('✓ Stored keys in secure IndexedDB storage');
    
    // Upload public keys to server
    console.log('Step 3: Uploading public keys to server...');
    await uploadPublicKeys(keys);
    console.log('✓ Uploaded public keys to server');
    
    console.log('✅ Signal Protocol initialization complete');
  } catch (error) {
    console.error('Failed to initialize Signal Protocol keys:');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

/**
 * Upload public keys to server
 * Only public keys are sent - private keys never leave the client
 */
async function uploadPublicKeys(keys: SignalProtocol.StoredKeys): Promise<void> {
  const payload = {
    identityKey: SignalProtocol.arrayBufferToBase64(keys.identityKeyPair.publicKey),
    signedPreKey: {
      keyId: keys.signedPreKey.keyId.toString(),
      publicKey: SignalProtocol.arrayBufferToBase64(keys.signedPreKey.keyPair.publicKey),
      signature: SignalProtocol.arrayBufferToBase64(keys.signedPreKey.signature),
    },
    preKeys: keys.preKeys.map(pk => ({
      keyId: pk.keyId.toString(),
      publicKey: SignalProtocol.arrayBufferToBase64(pk.keyPair.publicKey),
    })),
  };
  
  console.log('Uploading payload:', {
    identityKeyLength: payload.identityKey?.length,
    signedPreKeyExists: !!payload.signedPreKey,
    preKeysCount: payload.preKeys?.length,
  });
  
  const response = await fetch('/api/signal/keys', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Server error:', errorData);
    throw new Error(`Failed to upload public keys: ${errorData.message || response.statusText}`);
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
    
    // TODO: Check if we need to replenish prekeys
    // await checkAndReplenishPrekeys();
    
    return false; // Keys already existed
  } catch (error) {
    console.error('Failed to ensure Signal keys exist:', error);
    throw error;
  }
}

/**
 * Get prekey bundle for another user from server
 * Used to establish an encrypted session with a recipient
 */
export async function fetchPrekeyBundle(userId: string): Promise<SignalProtocol.PreKeyBundle> {
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
  theirIdentityKeyBase64: string
): Promise<string> {
  const myKeys = await KeyStorage.getSignalKeys();
  if (!myKeys) {
    throw new Error('No local keys found');
  }
  
  const theirIdentityKey = SignalProtocol.base64ToArrayBuffer(theirIdentityKeyBase64);
  
  return SignalProtocol.calculateSafetyNumber(
    myKeys.identityKeyPair.publicKey,
    myUserId,
    theirIdentityKey,
    theirUserId
  );
}
