import {
  KeyHelper,
  SignedPublicPreKeyType,
  SignalProtocolAddress,
  SessionBuilder,
  PreKeyType,
  SessionCipher,
  MessageType,
} from '@privacyresearch/libsignal-protocol-typescript';

/**
 * Signal Protocol E2E Encryption Library
 * 
 * This implements the Signal Protocol for true end-to-end encryption:
 * - X3DH key agreement protocol for session establishment
 * - Double Ratchet algorithm for forward secrecy
 * - PreKey bundles for asynchronous messaging
 * - Identity key management for trust verification
 * 
 * Using: @privacyresearch/libsignal-protocol-typescript (browser-compatible)
 */

export interface PreKeyBundle {
  identityKey: string;
  registrationId: number;
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

/**
 * Utility: Convert ArrayBuffer to base64 (browser-compatible)
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility: Convert base64 to ArrayBuffer (browser-compatible)
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Initialize Signal Protocol keys for a new user
 * Generates all necessary keys for E2E encryption
 */
export async function initializeSignalKeys(): Promise<StoredKeys> {
  // Generate identity key pair (root of trust)
  // Library returns { pubKey, privKey } - normalize to { publicKey, privateKey }
  const rawIdentityKeyPair = await KeyHelper.generateIdentityKeyPair();
  const identityKeyPair = {
    publicKey: rawIdentityKeyPair.pubKey,
    privateKey: rawIdentityKeyPair.privKey,
  };

  // Generate registration ID
  const registrationId = KeyHelper.generateRegistrationId();

  // Generate signed prekey (id starts at 1)
  const signedPreKeyId = 1;
  const rawSignedPreKey = await KeyHelper.generateSignedPreKey(rawIdentityKeyPair, signedPreKeyId);
  
  // Normalize key pair structure
  const signedPreKey = {
    keyId: signedPreKeyId,
    keyPair: {
      publicKey: rawSignedPreKey.keyPair.pubKey,
      privateKey: rawSignedPreKey.keyPair.privKey,
    },
    signature: rawSignedPreKey.signature,
  };

  // Generate one-time prekeys (100 keys starting at id 1)
  // Note: KeyHelper.generatePreKey is singular, so we call it in a loop
  const startPreKeyId = 1;
  const numPreKeys = 100;
  const preKeys = [];
  
  for (let i = 0; i < numPreKeys; i++) {
    const rawPreKey = await KeyHelper.generatePreKey(startPreKeyId + i);
    preKeys.push({
      keyId: rawPreKey.keyId,
      keyPair: {
        publicKey: rawPreKey.keyPair.pubKey,
        privateKey: rawPreKey.keyPair.privKey,
      },
    });
  }

  return {
    identityKeyPair,
    registrationId,
    signedPreKey,
    preKeys,
  };
}

/**
 * Create a PreKeyBundle for uploading to server
 * This allows other users to initiate encrypted sessions
 */
export function createPreKeyBundle(keys: StoredKeys, preKeyIndex: number = 0): PreKeyBundle {
  const preKey = keys.preKeys[preKeyIndex];
  
  return {
    identityKey: arrayBufferToBase64(keys.identityKeyPair.publicKey),
    registrationId: keys.registrationId,
    signedPreKey: {
      keyId: keys.signedPreKey.keyId,
      publicKey: arrayBufferToBase64(keys.signedPreKey.keyPair.publicKey),
      signature: arrayBufferToBase64(keys.signedPreKey.signature),
    },
    preKey: preKey ? {
      keyId: preKey.keyId,
      publicKey: arrayBufferToBase64(preKey.keyPair.publicKey),
    } : undefined,
  };
}

/**
 * Parse a PreKeyBundle received from server back to usable format
 */
export function parsePreKeyBundle(bundle: PreKeyBundle): {
  identityKey: ArrayBuffer;
  registrationId: number;
  signedPreKey: SignedPublicPreKeyType;
  preKey?: PreKeyType;
} {
  return {
    identityKey: base64ToArrayBuffer(bundle.identityKey),
    registrationId: bundle.registrationId,
    signedPreKey: {
      keyId: bundle.signedPreKey.keyId,
      publicKey: base64ToArrayBuffer(bundle.signedPreKey.publicKey),
      signature: base64ToArrayBuffer(bundle.signedPreKey.signature),
    },
    preKey: bundle.preKey ? {
      keyId: bundle.preKey.keyId,
      publicKey: base64ToArrayBuffer(bundle.preKey.publicKey),
    } : undefined,
  };
}

/**
 * Create a SignalProtocolAddress for a user
 */
export function createAddress(userId: string, deviceId: number = 1): SignalProtocolAddress {
  return new SignalProtocolAddress(userId, deviceId);
}

/**
 * Build a session with another user using their PreKeyBundle
 * This implements the X3DH key agreement protocol
 */
export async function buildSession(
  store: any, // SignalProtocolStore implementation
  recipientAddress: SignalProtocolAddress,
  preKeyBundle: PreKeyBundle
): Promise<void> {
  const sessionBuilder = new SessionBuilder(store, recipientAddress);
  const parsedBundle = parsePreKeyBundle(preKeyBundle);
  
  await sessionBuilder.processPreKey(parsedBundle);
}

/**
 * Encrypt a message for a recipient
 * Returns ciphertext and message type
 */
export async function encryptMessage(
  store: any, // SignalProtocolStore implementation
  recipientAddress: SignalProtocolAddress,
  plaintext: string
): Promise<{ type: MessageType; body: string }> {
  const sessionCipher = new SessionCipher(store, recipientAddress);
  const plaintextBuffer = new TextEncoder().encode(plaintext).buffer;
  
  const ciphertext = await sessionCipher.encrypt(plaintextBuffer);
  
  return {
    type: ciphertext.type,
    body: arrayBufferToBase64(ciphertext.body!),
  };
}

/**
 * Decrypt a message from a sender
 * Handles both PreKeyWhisperMessage (session establishment) and WhisperMessage (ongoing)
 */
export async function decryptMessage(
  store: any, // SignalProtocolStore implementation
  senderAddress: SignalProtocolAddress,
  ciphertext: { type: MessageType; body: string }
): Promise<string> {
  const sessionCipher = new SessionCipher(store, senderAddress);
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext.body);
  
  let plaintextBuffer: ArrayBuffer;
  
  if (ciphertext.type === MessageType.PREKEY_BUNDLE) {
    // First message - establish session
    plaintextBuffer = await sessionCipher.decryptPreKeyWhisperMessage(ciphertextBuffer);
  } else {
    // Ongoing session
    plaintextBuffer = await sessionCipher.decryptWhisperMessage(ciphertextBuffer);
  }
  
  return new TextDecoder().decode(plaintextBuffer);
}

/**
 * Calculate safety number (fingerprint) for identity verification
 * Users can compare these numbers to verify they're talking to the right person
 */
export function calculateSafetyNumber(
  localIdentityKey: ArrayBuffer,
  localIdentifier: string,
  remoteIdentityKey: ArrayBuffer,
  remoteIdentifier: string
): string {
  // Create a deterministic fingerprint from identity keys
  const localKeyHex = Array.from(new Uint8Array(localIdentityKey))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const remoteKeyHex = Array.from(new Uint8Array(remoteIdentityKey))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Combine and hash to create safety number
  const combined = localIdentifier < remoteIdentifier
    ? `${localIdentifier}${localKeyHex}${remoteIdentifier}${remoteKeyHex}`
    : `${remoteIdentifier}${remoteKeyHex}${localIdentifier}${localKeyHex}`;
  
  // Create a simple numeric safety number (in production, use proper fingerprint derivation)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Format as 12-digit safety number (grouped in 4s)
  const safetyNum = Math.abs(hash).toString().padStart(12, '0').slice(0, 12);
  return `${safetyNum.slice(0, 4)} ${safetyNum.slice(4, 8)} ${safetyNum.slice(8, 12)}`;
}
