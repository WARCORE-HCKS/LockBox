import {
  SignalProtocolAddress,
  SessionBuilder,
  SessionCipher,
} from '@privacyresearch/libsignal-protocol-typescript';
import { getSignalProtocolStore } from './signalProtocolStore';
import * as SignalProtocol from './signalProtocol';

/**
 * High-level Signal Protocol messaging functions
 * 
 * This module provides easy-to-use functions for encrypting and decrypting
 * messages using the Signal Protocol's Double Ratchet algorithm.
 */

// MessageType enum values from Signal Protocol
export const MESSAGE_TYPES = {
  PREKEY_BUNDLE: 3,
  WHISPER: 1,
} as const;

export interface EncryptedMessage {
  type: number; // 1 = WhisperMessage, 3 = PreKeyWhisperMessage
  body: ArrayBuffer;
  registrationId?: number;
}

/**
 * Fetch a user's prekey bundle from the server
 */
async function fetchPreKeyBundle(userId: string): Promise<SignalProtocol.PreKeyBundle> {
  const response = await fetch(`/api/signal/keys/${userId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch prekey bundle: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Ensure we have an encrypted session with a user
 * If no session exists, fetch their prekey bundle and establish one
 */
export async function ensureSession(recipientUserId: string): Promise<void> {
  const store = getSignalProtocolStore();
  const recipientAddress = new SignalProtocolAddress(recipientUserId, 1);

  // Check if we already have a session
  const hasSession = await store.hasSessionWith(recipientUserId);
  if (hasSession) {
    console.log(`✓ Session already exists with user ${recipientUserId}`);
    return;
  }

  console.log(`Building new session with user ${recipientUserId}...`);

  // Fetch recipient's prekey bundle
  const preKeyBundle = await fetchPreKeyBundle(recipientUserId);
  
  // Build session using X3DH key agreement
  const sessionBuilder = new SessionBuilder(store, recipientAddress);
  
  // Parse the prekey bundle
  const parsedBundle = {
    identityKey: SignalProtocol.base64ToArrayBuffer(preKeyBundle.identityKey),
    registrationId: preKeyBundle.registrationId,
    signedPreKey: {
      keyId: preKeyBundle.signedPreKey.keyId,
      publicKey: SignalProtocol.base64ToArrayBuffer(preKeyBundle.signedPreKey.publicKey),
      signature: SignalProtocol.base64ToArrayBuffer(preKeyBundle.signedPreKey.signature),
    },
    preKey: preKeyBundle.preKey ? {
      keyId: preKeyBundle.preKey.keyId,
      publicKey: SignalProtocol.base64ToArrayBuffer(preKeyBundle.preKey.publicKey),
    } : undefined,
  };

  // Build the session
  await sessionBuilder.processPreKey(parsedBundle);
  
  console.log(`✓ Session established with user ${recipientUserId}`);
}

/**
 * Encrypt a message for a recipient using Signal Protocol
 * Automatically establishes session if needed
 */
export async function encryptMessageForUser(
  recipientUserId: string,
  plaintext: string
): Promise<EncryptedMessage> {
  // Ensure we have a session
  await ensureSession(recipientUserId);

  const store = getSignalProtocolStore();
  const recipientAddress = new SignalProtocolAddress(recipientUserId, 1);
  
  // Encrypt the message
  const sessionCipher = new SessionCipher(store, recipientAddress);
  const plaintextBuffer = new TextEncoder().encode(plaintext).buffer;
  
  const ciphertext = await sessionCipher.encrypt(plaintextBuffer);
  
  // The library returns body as ArrayBuffer or Uint8Array
  // TypeScript types may be incorrect, so we handle it carefully
  const body: any = ciphertext.body;
  if (!body) {
    throw new Error('Encryption failed: no ciphertext body');
  }
  
  // Convert to proper ArrayBuffer
  // IMPORTANT: If body is a Uint8Array view, we need to slice the buffer properly
  const bodyBuffer: ArrayBuffer = (body instanceof Uint8Array) 
    ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)
    : body;
  
  return {
    type: ciphertext.type!,
    body: bodyBuffer,
    registrationId: ciphertext.registrationId,
  };
}

/**
 * Decrypt a message from a sender using Signal Protocol
 * Automatically handles session establishment if this is the first message
 */
export async function decryptMessageFromUser(
  senderUserId: string,
  encryptedMessage: EncryptedMessage
): Promise<string> {
  const store = getSignalProtocolStore();
  const senderAddress = new SignalProtocolAddress(senderUserId, 1);
  
  const sessionCipher = new SessionCipher(store, senderAddress);
  const ciphertextBuffer = encryptedMessage.body;
  
  let plaintextBuffer: ArrayBuffer;
  
  if (encryptedMessage.type === MESSAGE_TYPES.PREKEY_BUNDLE) {
    // First message from sender - establish session
    console.log(`Establishing session with sender ${senderUserId}...`);
    plaintextBuffer = await sessionCipher.decryptPreKeyWhisperMessage(ciphertextBuffer);
    console.log(`✓ Session established with sender ${senderUserId}`);
  } else {
    // Ongoing session
    plaintextBuffer = await sessionCipher.decryptWhisperMessage(ciphertextBuffer);
  }
  
  return new TextDecoder().decode(plaintextBuffer);
}

/**
 * Check if we have an active session with a user
 */
export async function hasSessionWith(userId: string): Promise<boolean> {
  const store = getSignalProtocolStore();
  return store.hasSessionWith(userId);
}

/**
 * Clear session with a specific user (for debugging or security reset)
 */
export async function clearSessionWith(userId: string): Promise<void> {
  const store = getSignalProtocolStore();
  const addressString = `${userId}.1`;
  const session = await store.loadSession(addressString);
  
  if (session) {
    await store.storeSession(addressString, {} as any); // Clear the session
    console.log(`Cleared session with user ${userId}`);
  }
}
