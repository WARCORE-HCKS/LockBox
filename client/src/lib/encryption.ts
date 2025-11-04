import CryptoJS from "crypto-js";
import * as SignalMessaging from './signalMessaging';
import * as SignalProtocol from './signalProtocol';

/**
 * Encryption Module
 * 
 * This module handles both legacy and Signal Protocol encryption:
 * - LEGACY (Chatrooms): Shared-key encryption using CryptoJS
 * - SIGNAL PROTOCOL (Private Messages): True E2E encryption using Signal Protocol
 * 
 * Migration Strategy:
 * - Chatroom messages still use shared-key encryption (to be upgraded to Sender Keys)
 * - Private messages now use Signal Protocol for true E2E encryption
 * - Messages are tagged with encryptionVersion to support both formats
 */

// Legacy shared keys (still used for chatrooms)
const CHATROOM_KEY = "securechat_shared_chatroom_key_v1";
const PRIVATE_MESSAGE_KEY_LEGACY = "securechat_shared_private_key_v1";

export interface EncryptedPayload {
  version: 'legacy' | 'signal';
  data: string; // Base64 encoded
  type?: number; // Signal Protocol message type (if version=signal)
}

/**
 * Encrypt a private message using Signal Protocol
 * Returns a payload that includes version tag and encrypted data
 */
export async function encryptPrivateMessage(
  recipientUserId: string,
  message: string
): Promise<string> {
  try {
    // Use Signal Protocol for E2E encryption
    const encrypted = await SignalMessaging.encryptMessageForUser(recipientUserId, message);
    
    const payload: EncryptedPayload = {
      version: 'signal',
      data: SignalProtocol.arrayBufferToBase64(encrypted.body),
      type: encrypted.type,
    };
    
    return JSON.stringify(payload);
  } catch (error) {
    console.error('Failed to encrypt with Signal Protocol, falling back to legacy:', error);
    
    // Fallback to legacy encryption if Signal Protocol fails
    return encryptMessageLegacy(message, false);
  }
}

/**
 * Decrypt a private message (handles both Signal Protocol and legacy)
 */
export async function decryptPrivateMessage(
  senderUserId: string,
  encryptedPayload: string
): Promise<string> {
  try {
    // Try to parse as new format (with version tag)
    const payload: EncryptedPayload = JSON.parse(encryptedPayload);
    
    if (payload.version === 'signal') {
      // Signal Protocol encrypted message
      const body = SignalProtocol.base64ToArrayBuffer(payload.data);
      const encrypted: SignalMessaging.EncryptedMessage = {
        type: payload.type!,
        body,
      };
      
      return await SignalMessaging.decryptMessageFromUser(senderUserId, encrypted);
    } else {
      // Legacy encryption
      return decryptMessageLegacy(payload.data, false);
    }
  } catch (parseError) {
    // If parsing fails, assume it's legacy format (raw encrypted string)
    return decryptMessageLegacy(encryptedPayload, false);
  }
}

/**
 * Encrypt a chatroom message using legacy shared-key encryption
 * TODO: Upgrade to Signal Protocol's Sender Keys for group encryption
 */
export function encryptChatroomMessage(message: string): string {
  return encryptMessageLegacy(message, true);
}

/**
 * Decrypt a chatroom message using legacy shared-key encryption
 */
export function decryptChatroomMessage(encryptedMessage: string): string {
  try {
    // Parse JSON wrapper if present
    const payload: EncryptedPayload = JSON.parse(encryptedMessage);
    return decryptMessageLegacy(payload.data, true);
  } catch {
    // Legacy format (raw encrypted string without JSON wrapper)
    return decryptMessageLegacy(encryptedMessage, true);
  }
}

/**
 * Legacy encryption function (shared-key AES)
 * Still used for chatrooms, will be replaced by Sender Keys protocol
 */
function encryptMessageLegacy(message: string, useChatroomKey: boolean = false): string {
  const key = useChatroomKey ? CHATROOM_KEY : PRIVATE_MESSAGE_KEY_LEGACY;
  
  const encrypted = CryptoJS.AES.encrypt(message, key).toString();
  
  const payload: EncryptedPayload = {
    version: 'legacy',
    data: encrypted,
  };
  
  return JSON.stringify(payload);
}

/**
 * Legacy decryption function (shared-key AES)
 */
function decryptMessageLegacy(encryptedMessage: string, useChatroomKey: boolean = false): string {
  try {
    const key = useChatroomKey ? CHATROOM_KEY : PRIVATE_MESSAGE_KEY_LEGACY;
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      return "[Unable to decrypt - invalid encrypted content]";
    }
    
    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt legacy message:", error);
    return "[Encrypted message - decryption failed]";
  }
}

/**
 * Backwards compatibility: Keep old function names for chatroom messages
 */
export function encryptMessage(message: string, useChatroomKey: boolean = false): string {
  return encryptMessageLegacy(message, useChatroomKey);
}

export function decryptMessage(encryptedMessage: string, useChatroomKey: boolean = false): string {
  try {
    const payload: EncryptedPayload = JSON.parse(encryptedMessage);
    return decryptMessageLegacy(payload.data, useChatroomKey);
  } catch {
    // Legacy format (raw encrypted string)
    return decryptMessageLegacy(encryptedMessage, useChatroomKey);
  }
}

export function exportEncryptionKey(): string {
  return PRIVATE_MESSAGE_KEY_LEGACY;
}
