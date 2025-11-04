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
const DB_VERSION = 1;
const STORE_NAME = 'sent_messages';

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
          
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'messageId' });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
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
}

// Singleton instance
export const sentMessageCache = new SentMessageCache();
