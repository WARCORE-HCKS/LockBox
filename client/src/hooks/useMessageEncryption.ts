import { useState, useCallback } from 'react';
import {
  encryptPrivateMessage,
  decryptPrivateMessage,
  encryptChatroomMessage,
  decryptChatroomMessage,
} from '@/lib/encryption';

/**
 * Hook for handling async message encryption/decryption
 * 
 * Provides convenient functions for encrypting and decrypting messages
 * using either Signal Protocol (for private messages) or legacy encryption (for chatrooms).
 */
export function useMessageEncryption() {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  /**
   * Encrypt a private message using Signal Protocol E2E encryption
   */
  const encryptPrivate = useCallback(async (recipientUserId: string, message: string): Promise<string> => {
    setIsEncrypting(true);
    try {
      return await encryptPrivateMessage(recipientUserId, message);
    } finally {
      setIsEncrypting(false);
    }
  }, []);

  /**
   * Decrypt a private message using Signal Protocol
   */
  const decryptPrivate = useCallback(async (senderUserId: string, encryptedMessage: string): Promise<string> => {
    setIsDecrypting(true);
    try {
      return await decryptPrivateMessage(senderUserId, encryptedMessage);
    } finally {
      setIsDecrypting(false);
    }
  }, []);

  /**
   * Encrypt a chatroom message using legacy shared-key encryption
   */
  const encryptChatroom = useCallback((message: string): string => {
    return encryptChatroomMessage(message);
  }, []);

  /**
   * Decrypt a chatroom message using legacy shared-key encryption
   */
  const decryptChatroom = useCallback((encryptedMessage: string): string => {
    return decryptChatroomMessage(encryptedMessage);
  }, []);

  /**
   * Decrypt a batch of private messages
   */
  const decryptPrivateBatch = useCallback(async (
    messages: Array<{ senderId: string; recipientId: string; encryptedContent: string }>,
    currentUserId: string
  ): Promise<string[]> => {
    setIsDecrypting(true);
    try {
      const decryptPromises = messages.map(async (msg) => {
        // Determine who sent the message (the other user, not us)
        const senderUserId = msg.senderId === currentUserId ? msg.recipientId : msg.senderId;
        return await decryptPrivateMessage(senderUserId, msg.encryptedContent);
      });
      
      return await Promise.all(decryptPromises);
    } finally {
      setIsDecrypting(false);
    }
  }, []);

  return {
    encryptPrivate,
    decryptPrivate,
    encryptChatroom,
    decryptChatroom,
    decryptPrivateBatch,
    isEncrypting,
    isDecrypting,
  };
}
