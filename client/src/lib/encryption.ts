import CryptoJS from "crypto-js";

// Simplified encryption for demonstration purposes
// NOTE: This is NOT a secure end-to-end encryption implementation
// 
// Current approach uses shared keys for both private and chatroom messages:
// - CHATROOM_KEY: Shared key for all chatroom messages
// - PRIVATE_MESSAGE_KEY: Shared key for all private messages
//
// This means:
// - All users can decrypt all messages (not true E2E encryption)
// - Keys are visible in client source code
// - Server operator or anyone inspecting the code can decrypt messages
//
// For production, you would need:
// - Asymmetric encryption (RSA, Curve25519)
// - Key exchange protocol (Diffie-Hellman, Signal Protocol)
// - Per-conversation keys encrypted for each participant
// - Hardware-backed key storage
// - Key rotation and perfect forward secrecy

const CHATROOM_KEY = "securechat_shared_chatroom_key_v1";
const PRIVATE_MESSAGE_KEY = "securechat_shared_private_key_v1";

export function encryptMessage(message: string, useChatroomKey: boolean = false): string {
  const key = useChatroomKey ? CHATROOM_KEY : PRIVATE_MESSAGE_KEY;
  return CryptoJS.AES.encrypt(message, key).toString();
}

export function decryptMessage(encryptedMessage: string, useChatroomKey: boolean = false): string {
  try {
    const key = useChatroomKey ? CHATROOM_KEY : PRIVATE_MESSAGE_KEY;
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      return "[Unable to decrypt - invalid encrypted content]";
    }
    
    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt message:", error);
    return "[Encrypted message - decryption failed]";
  }
}

export function exportEncryptionKey(): string {
  return PRIVATE_MESSAGE_KEY;
}
