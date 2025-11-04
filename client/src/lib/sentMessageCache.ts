/**
 * Local cache for sent message plaintexts
 * 
 * This solves the problem that we can't decrypt our own sent messages
 * using Signal Protocol (they're encrypted with the recipient's public key).
 * 
 * We store our sent message plaintexts locally in IndexedDB so we can
 * display them in message history without needing to decrypt.
 */

const DB_NAME = 'lockbox-sent-messages';
const DB_VERSION = 3; // Increment version for schema change (tempId as primary key)
const STORE_NAME = 'sent_messages';
const PENDING_STORE_NAME = 'pending_messages';

// In-memory cache for recently sent messages (temp ID → plaintext)
// This helps match messages when server echo arrives
interface PendingSentMessage {
  tempId: string;
  plaintext: string;
  recipientId: string;
  timestamp: number;
}

const pendingSentMessages: PendingSentMessage[] = [];

class SentMessageCache {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   * Fails gracefully if IndexedDB is unavailable (Safari Private Mode, etc.)
   */
  async init(): Promise<void> {
    if (this.db) return;

    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.warn('SentMessageCache: IndexedDB unavailable (Private Mode?)');
          resolve(); // Resolve instead of reject to fail gracefully
        };
        
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create sent_messages store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'messageId' });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
          
          // Create pending_messages store for temp caching (use tempId as primary key)
          if (!db.objectStoreNames.contains(PENDING_STORE_NAME)) {
            const pendingStore = db.createObjectStore(PENDING_STORE_NAME, { keyPath: 'tempId' });
            pendingStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          } else {
            // Recreate store if upgrading from version 2 to 3
            db.deleteObjectStore(PENDING_STORE_NAME);
            const pendingStore = db.createObjectStore(PENDING_STORE_NAME, { keyPath: 'tempId' });
            pendingStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          }
        };
      });
    } catch (error) {
      console.warn('SentMessageCache: IndexedDB not supported:', error);
      // Fail gracefully - messaging should still work without cache
    }
  }

  /**
   * Store plaintext of a sent message
   * Fails gracefully if storage is unavailable (Safari Private Mode, quota exceeded, etc.)
   */
  async storeSentMessage(messageId: string, plaintext: string): Promise<void> {
    try {
      await this.init();
      if (!this.db) {
        console.warn('SentMessageCache: Database not available, skipping cache');
        return;
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const data = {
          messageId,
          plaintext,
          timestamp: Date.now(),
        };
        
        const request = store.put(data);
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn('SentMessageCache: Failed to store message, continuing anyway');
          resolve(); // Resolve instead of reject to fail gracefully
        };
      });
    } catch (error) {
      console.warn('SentMessageCache: Storage unavailable, continuing without cache:', error);
      // Fail gracefully - don't throw
    }
  }

  /**
   * Retrieve plaintext of a sent message
   * Returns null if storage is unavailable
   */
  async getSentMessage(messageId: string): Promise<string | null> {
    try {
      await this.init();
      if (!this.db) {
        console.warn('SentMessageCache: Database not available');
        return null;
      }

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(messageId);
        
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.plaintext : null);
        };
        request.onerror = () => {
          console.warn('SentMessageCache: Failed to retrieve message');
          resolve(null); // Return null instead of rejecting
        };
      });
    } catch (error) {
      console.warn('SentMessageCache: Storage unavailable:', error);
      return null; // Fail gracefully
    }
  }

  /**
   * Clear old messages (keep last 1000)
   */
  async cleanup(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      
      // Get all entries ordered by timestamp
      const request = index.openCursor(null, 'prev');
      let count = 0;
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          count++;
          // Delete entries after the first 1000
          if (count > 1000) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Track a pending sent message (both in-memory and IndexedDB for persistence)
   * This allows matching even after page reload
   */
  async trackPendingMessage(tempId: string, plaintext: string, recipientId: string): Promise<void> {
    const newPending = {
      tempId,
      plaintext,
      recipientId,
      timestamp: Date.now(),
    };
    
    // Store in-memory for fast access
    pendingSentMessages.push(newPending);
    console.log('[SentMessageCache] Tracked pending:', { 
      tempId, 
      recipientId, 
      timestamp: newPending.timestamp,
      pendingCount: pendingSentMessages.length
    });
    
    // Also persist to IndexedDB for reliability across page reloads
    try {
      await this.init();
      if (!this.db) return;
      
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([PENDING_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(PENDING_STORE_NAME);
        
        // Store with tempId as primary key for simple, deterministic lookup
        const data = {
          tempId,
          recipientId,
          plaintext,
          timestamp: newPending.timestamp,
          expiresAt: Date.now() + 60000, // Expire after 60 seconds
        };
        
        const request = store.put(data);
        
        request.onsuccess = () => {
          console.log('[SentMessageCache] Successfully persisted pending message to IndexedDB:', tempId);
          resolve();
        };
        request.onerror = () => {
          console.warn('[SentMessageCache] Failed to persist pending message:', request.error);
          resolve(); // Don't fail the operation
        };
      });
    } catch (error) {
      console.warn('[SentMessageCache] Failed to persist pending:', error);
      // Continue without IndexedDB persistence
    }
    
    // Clean up old in-memory pending messages (older than 30 seconds)
    const cutoff = Date.now() - 30000;
    const index = pendingSentMessages.findIndex(m => m.timestamp < cutoff);
    if (index >= 0) {
      pendingSentMessages.splice(0, index + 1);
    }
  }

  /**
   * Find and remove a pending message by clientMessageId (deterministic matching)
   * This replaces the brittle timestamp-based matching approach
   */
  async matchPendingMessage(clientMessageId: string | undefined): Promise<string | null> {
    if (!clientMessageId) {
      console.warn('[SentMessageCache] No clientMessageId provided for matching');
      return null;
    }
    
    console.log('[SentMessageCache] Matching pending message by clientMessageId:', {
      clientMessageId,
      pendingCount: pendingSentMessages.length
    });
    
    // First, try IndexedDB (more reliable, persists across reloads)
    try {
      await this.init();
      if (this.db) {
        const result: string | null = await new Promise((resolve) => {
          const transaction = this.db!.transaction([PENDING_STORE_NAME], 'readwrite');
          const store = transaction.objectStore(PENDING_STORE_NAME);
          
          // Direct lookup by tempId (primary key) - deterministic and efficient
          const request = store.get(clientMessageId);
          
          request.onsuccess = () => {
            const pending = request.result;
            
            if (pending) {
              console.log('[SentMessageCache] Match found in IndexedDB by clientMessageId!', {
                tempId: pending.tempId,
                recipientId: pending.recipientId
              });
              
              // Delete the matched entry
              store.delete(clientMessageId);
              
              resolve(pending.plaintext);
            } else {
              console.warn('[SentMessageCache] No pending entry found in IndexedDB for clientMessageId:', clientMessageId);
              resolve(null);
            }
          };
          
          request.onerror = () => {
            console.error('[SentMessageCache] IndexedDB get error:', request.error);
            resolve(null);
          };
        });
        
        if (result) {
          // Also clean from in-memory if present
          const index = pendingSentMessages.findIndex(m => m.tempId === clientMessageId);
          if (index >= 0) {
            pendingSentMessages.splice(index, 1);
          }
          return result;
        }
      }
    } catch (error) {
      console.warn('[SentMessageCache] IndexedDB lookup failed:', error);
    }
    
    // Fall back to in-memory matching (also deterministic by tempId)
    const index = pendingSentMessages.findIndex(m => m.tempId === clientMessageId);
    
    if (index >= 0) {
      const pending = pendingSentMessages[index];
      console.log('[SentMessageCache] Match found in memory by clientMessageId!');
      // Remove from pending list
      pendingSentMessages.splice(index, 1);
      return pending.plaintext;
    }
    
    console.warn('[SentMessageCache] No match found for clientMessageId:', clientMessageId);
    return null;
  }

  /**
   * Clean up expired pending messages from IndexedDB
   */
  async cleanupExpiredPending(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;
      
      const now = Date.now();
      
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([PENDING_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(PENDING_STORE_NAME);
        const index = store.index('expiresAt');
        
        const range = IDBKeyRange.upperBound(now);
        const request = index.openCursor(range);
        
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        request.onerror = () => resolve();
      });
    } catch (error) {
      console.warn('[SentMessageCache] Cleanup failed:', error);
    }
  }
}

// Singleton instance
export const sentMessageCache = new SentMessageCache();
