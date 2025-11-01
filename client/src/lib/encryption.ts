import CryptoJS from "crypto-js";

// Per-user encryption key stored in localStorage
// NOTE: This is a simplified encryption model for demonstration purposes
// In a production app, you would use:
// - Asymmetric encryption (public/private key pairs)
// - Key exchange protocols (Diffie-Hellman, Signal Protocol, etc.)
// - Hardware security modules or secure enclaves for key storage
//
// Current limitations:
// - Keys are stored in browser localStorage (vulnerable to XSS)
// - No key rotation or recovery mechanism
// - Server operator could theoretically inject code to capture keys
//
// This implementation ensures:
// - Each user has their own unique encryption key
// - Messages are encrypted before leaving the client
// - Messages are stored and transmitted only in encrypted form
// - Users without the key cannot decrypt messages

const KEY_STORAGE_KEY = "securechat_encryption_key";

function getUserEncryptionKey(): string {
  let key = localStorage.getItem(KEY_STORAGE_KEY);
  
  if (!key) {
    // Generate a new random encryption key for this user
    key = CryptoJS.lib.WordArray.random(256/8).toString();
    localStorage.setItem(KEY_STORAGE_KEY, key);
  }
  
  return key;
}

export function encryptMessage(message: string): string {
  const key = getUserEncryptionKey();
  return CryptoJS.AES.encrypt(message, key).toString();
}

export function decryptMessage(encryptedMessage: string): string {
  try {
    const key = getUserEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      // If decryption fails (wrong key), return indicator
      return "[Unable to decrypt - different encryption key]";
    }
    
    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt message:", error);
    return "[Encrypted message - decryption failed]";
  }
}

export function exportEncryptionKey(): string {
  return getUserEncryptionKey();
}

export function importEncryptionKey(key: string): void {
  localStorage.setItem(KEY_STORAGE_KEY, key);
}
