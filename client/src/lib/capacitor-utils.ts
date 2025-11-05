/**
 * Capacitor Mobile Platform Utilities
 * 
 * Provides helpers for detecting native platforms and accessing
 * platform-specific features like secure storage.
 */

import { Capacitor } from '@capacitor/core';
import { keyStorage } from './keyStorage';

/**
 * Check if running on a native mobile platform (iOS or Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get the current platform name
 * @returns 'ios' | 'android' | 'web'
 */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}

/**
 * Secure Storage wrapper for encryption keys
 * 
 * On native platforms: Uses native keychain (iOS) or keystore (Android)
 * On web: Falls back to IndexedDB with WebCrypto encryption
 */
export class SecureKeyStorage {
  private static secureStorage: any = null;

  /**
   * Initialize secure storage (lazy load for web compatibility)
   */
  private static async getStorage() {
    if (isNativePlatform()) {
      if (!this.secureStorage) {
        const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
        this.secureStorage = SecureStorage;
      }
      return this.secureStorage;
    }
    return null; // Use existing IndexedDB implementation on web
  }

  /**
   * Store a value securely
   * @param key - Storage key
   * @param value - Value to store (any JSON-serializable type except null)
   */
  static async set(key: string, value: string | number | boolean | object): Promise<void> {
    if (value === null || value === undefined) {
      throw new Error('Cannot store null or undefined values in secure storage');
    }
    
    const storage = await this.getStorage();
    if (storage) {
      // Native platform: Use iOS Keychain or Android Keystore
      // API: set(key: string, data: DataType, convertDate?: boolean, sync?: boolean)
      await storage.set(key, value as any);
    } else {
      // Web platform: Use existing IndexedDB with WebCrypto encryption
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await keyStorage.setItem(key, stringValue);
    }
  }

  /**
   * Retrieve a value securely
   * @param key - Storage key
   * @returns The stored value or null if not found
   */
  static async get(key: string): Promise<string | null> {
    const storage = await this.getStorage();
    if (storage) {
      try {
        // Native platform: Use iOS Keychain or Android Keystore
        // API: get(key: string, convertDate?: boolean, sync?: boolean) => Promise<DataType | null>
        const value = await storage.get(key);
        return value !== null && value !== undefined ? String(value) : null;
      } catch (error) {
        console.error('[SecureKeyStorage] Error retrieving key:', error);
        return null;
      }
    } else {
      // Web platform: Use existing IndexedDB with WebCrypto encryption
      return await keyStorage.getItem(key);
    }
  }

  /**
   * Remove a value
   * @param key - Storage key
   */
  static async remove(key: string): Promise<void> {
    const storage = await this.getStorage();
    if (storage) {
      // Native platform: Use iOS Keychain or Android Keystore
      // API: remove(key: string, sync?: boolean) => Promise<boolean>
      await storage.remove(key);
    } else {
      // Web platform: Use existing IndexedDB with WebCrypto encryption
      await keyStorage.removeItem(key);
    }
  }

  /**
   * Clear all stored values
   */
  static async clear(): Promise<void> {
    const storage = await this.getStorage();
    if (storage) {
      // Native platform: Use iOS Keychain or Android Keystore
      await storage.clear();
    } else {
      // Web platform: Use existing IndexedDB with WebCrypto encryption
      await keyStorage.clear();
    }
  }

  /**
   * Get all keys
   */
  static async keys(): Promise<string[]> {
    const storage = await this.getStorage();
    if (storage) {
      // Native platform: Use iOS Keychain or Android Keystore
      // API: keys(sync?: boolean) => Promise<string[]>
      return await storage.keys();
    } else {
      // Web platform: Use existing IndexedDB with WebCrypto encryption
      return await keyStorage.getAllKeys();
    }
  }
}

/**
 * Platform-specific initialization
 * Call this on app startup to configure platform features
 */
export async function initializeMobilePlatform() {
  if (!isNativePlatform()) {
    console.log('[Capacitor] Running on web platform');
    return;
  }

  const platform = getPlatform();
  console.log(`[Capacitor] Running on ${platform} platform`);

  // Initialize status bar styling
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    console.log('[Capacitor] Status bar configured');
  } catch (error) {
    console.warn('[Capacitor] Status bar configuration failed:', error);
  }

  // Initialize keyboard behavior
  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
    console.log('[Capacitor] Keyboard configured');
  } catch (error) {
    console.warn('[Capacitor] Keyboard configuration failed:', error);
  }

  // Hide splash screen after app is ready
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
    console.log('[Capacitor] Splash screen hidden');
  } catch (error) {
    console.warn('[Capacitor] Splash screen hide failed:', error);
  }
}
