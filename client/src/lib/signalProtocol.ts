import * as SignalClient from '@signalapp/libsignal-client';

/**
 * Signal Protocol E2E Encryption Library
 * 
 * This implements the Signal Protocol for true end-to-end encryption:
 * - X3DH key agreement protocol for session establishment
 * - Double Ratchet algorithm for forward secrecy
 * - PreKey bundles for asynchronous messaging
 * - Identity key management for trust verification
 */

export interface PreKeyBundle {
  identityKey: string;
  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };
  preKey?: {
    keyId: number;
    publicKey: string;
  };
}

export interface StoredKeys {
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

/**
 * Generate a new identity key pair for the user
 * This is the root of trust for all encrypted communications
 */
export async function generateIdentityKeyPair(): Promise<SignalClient.PrivateKey> {
  return SignalClient.PrivateKey.generate();
}

/**
 * Generate a registration ID (random identifier for this device/session)
 */
export function generateRegistrationId(): number {
  return Math.floor(Math.random() * 16384) + 1;
}

/**
 * Generate signed prekey
 * Signed by identity key to prove authenticity
 */
export async function generateSignedPreKey(
  identityKeyPair: SignalClient.PrivateKey,
  signedPreKeyId: number
): Promise<{
  keyId: number;
  publicKey: SignalClient.PublicKey;
  privateKey: SignalClient.PrivateKey;
  signature: Uint8Array;
}> {
  const keyPair = SignalClient.PrivateKey.generate();
  const publicKey = keyPair.getPublicKey();
  const signature = identityKeyPair.sign(publicKey.serialize());

  return {
    keyId: signedPreKeyId,
    publicKey,
    privateKey: keyPair,
    signature,
  };
}

/**
 * Generate one-time prekeys for asynchronous messaging
 * Each prekey is used once then discarded for forward secrecy
 */
export async function generatePreKeys(
  startId: number,
  count: number
): Promise<Array<{
  keyId: number;
  publicKey: SignalClient.PublicKey;
  privateKey: SignalClient.PrivateKey;
}>> {
  const preKeys: Array<{
    keyId: number;
    publicKey: SignalClient.PublicKey;
    privateKey: SignalClient.PrivateKey;
  }> = [];

  for (let i = 0; i < count; i++) {
    const keyId = startId + i;
    const keyPair = SignalClient.PrivateKey.generate();
    
    preKeys.push({
      keyId,
      publicKey: keyPair.getPublicKey(),
      privateKey: keyPair,
    });
  }

  return preKeys;
}

/**
 * Utility: Convert Uint8Array to base64 (browser-compatible)
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Utility: Convert base64 to Uint8Array (browser-compatible)
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Serialize keys to base64 for storage/transmission
 */
export function serializePublicKey(key: SignalClient.PublicKey): string {
  return arrayBufferToBase64(key.serialize());
}

export function serializePrivateKey(key: SignalClient.PrivateKey): string {
  return arrayBufferToBase64(key.serialize());
}

export function serializeSignature(signature: Uint8Array): string {
  return arrayBufferToBase64(signature);
}

/**
 * Deserialize keys from base64 storage
 */
export function deserializePublicKey(serialized: string): SignalClient.PublicKey {
  const buffer = base64ToArrayBuffer(serialized);
  return SignalClient.PublicKey.deserialize(buffer);
}

export function deserializePrivateKey(serialized: string): SignalClient.PrivateKey {
  const buffer = base64ToArrayBuffer(serialized);
  return SignalClient.PrivateKey.deserialize(buffer);
}

/**
 * Initialize Signal Protocol keys for a new user
 * Generates all necessary keys for E2E encryption
 */
export async function initializeSignalKeys(): Promise<StoredKeys> {
  // Generate identity key pair (root of trust)
  const identityPrivateKey = await generateIdentityKeyPair();
  const identityPublicKey = identityPrivateKey.getPublicKey();

  // Generate registration ID
  const registrationId = generateRegistrationId();

  // Generate signed prekey (id starts at 1)
  const signedPreKey = await generateSignedPreKey(identityPrivateKey, 1);

  // Generate one-time prekeys (100 keys starting at id 1)
  const preKeys = await generatePreKeys(1, 100);

  return {
    identityKeyPair: {
      publicKey: serializePublicKey(identityPublicKey),
      privateKey: serializePrivateKey(identityPrivateKey),
    },
    registrationId,
    signedPreKey: {
      keyId: signedPreKey.keyId,
      publicKey: serializePublicKey(signedPreKey.publicKey),
      privateKey: serializePrivateKey(signedPreKey.privateKey),
      signature: serializeSignature(signedPreKey.signature),
    },
    preKeys: preKeys.map(pk => ({
      keyId: pk.keyId,
      publicKey: serializePublicKey(pk.publicKey),
      privateKey: serializePrivateKey(pk.privateKey),
    })),
  };
}

/**
 * Create a PreKeyBundle for uploading to server
 * This allows other users to initiate encrypted sessions
 */
export function createPreKeyBundle(keys: StoredKeys, preKeyIndex: number = 0): PreKeyBundle {
  const preKey = keys.preKeys[preKeyIndex];
  
  return {
    identityKey: keys.identityKeyPair.publicKey,
    signedPreKey: {
      keyId: keys.signedPreKey.keyId,
      publicKey: keys.signedPreKey.publicKey,
      signature: keys.signedPreKey.signature,
    },
    preKey: preKey ? {
      keyId: preKey.keyId,
      publicKey: preKey.publicKey,
    } : undefined,
  };
}

/**
 * Calculate safety number (fingerprint) for identity verification
 * Users can compare these numbers to verify they're talking to the right person
 */
export function calculateSafetyNumber(
  localIdentityKey: string,
  localIdentifier: string,
  remoteIdentityKey: string,
  remoteIdentifier: string
): string {
  const localKey = deserializePublicKey(localIdentityKey);
  const remoteKey = deserializePublicKey(remoteIdentityKey);

  const localIdBytes = new TextEncoder().encode(localIdentifier);
  const remoteIdBytes = new TextEncoder().encode(remoteIdentifier);

  const fingerprint = SignalClient.Fingerprint.new(
    5200, // iterations (standard Signal value)
    2,    // version
    localIdBytes,
    localKey,
    remoteIdBytes,
    remoteKey
  );

  return fingerprint.displayableFingerprint().toString();
}
