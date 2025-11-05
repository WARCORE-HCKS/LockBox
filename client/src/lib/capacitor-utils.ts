/**
 * Capacitor Mobile Platform Utilities
 * 
 * Provides helpers for detecting native platforms and accessing
 * platform-specific features like secure storage.
 */

import { Capacitor } from '@capacitor/core';
import type { SecureStorage } from '@aparajita/capacitor-secure-storage';

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
  private static secureStorage: typeof SecureStorage | null = null;

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
      // SecureStorage.set() accepts any JSON type directly (except null)
      await storage.set(key, value as any);
    } else {
      // On web, delegate to existing IndexedDB encryption system
      // This should be integrated with the existing signal-encryption.ts storage
      throw new Error('Use existing IndexedDB key storage on web platform');
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
        // SecureStorage.get() returns the value directly (or null)
        const value = await storage.get(key);
        return value !== null && value !== undefined ? String(value) : null;
      } catch (error) {
        console.error('[SecureKeyStorage] Error retrieving key:', error);
        return null;
      }
    } else {
      throw new Error('Use existing IndexedDB key storage on web platform');
    }
  }

  /**
   * Remove a value
   * @param key - Storage key
   */
  static async remove(key: string): Promise<void> {
    const storage = await this.getStorage();
    if (storage) {
      await storage.remove(key);
    }
  }

  /**
   * Clear all stored values
   */
  static async clear(): Promise<void> {
    const storage = await this.getStorage();
    if (storage) {
      await storage.clear();
    }
  }

  /**
   * Get all keys
   */
  static async keys(): Promise<string[]> {
    const storage = await this.getStorage();
    if (storage) {
      // SecureStorage.keys() returns string[] directly
      return await storage.keys();
    }
    return [];
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
