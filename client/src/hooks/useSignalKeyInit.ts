import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { ensureSignalKeysExist } from '@/lib/signalKeyManager';

/**
 * Hook to automatically initialize Signal Protocol keys when user authenticates
 * Runs once per session and ensures the user has E2E encryption keys set up
 */
export function useSignalKeyInit() {
  const { user, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsInitialized(false);
      return;
    }

    // TODO: Signal Protocol initialization temporarily disabled due to library compatibility issues
    // The @signalapp/libsignal-client library requires Node.js polyfills for browser use
    // This will be re-enabled once proper browser build configuration is in place
    
    console.log('Signal Protocol key initialization: disabled (work in progress)');
    setIsInitialized(true);
    setError(null);

    // ORIGINAL CODE (commented out until library compatibility is resolved):
    // const initKeys = async () => {
    //   try {
    //     console.log('Checking Signal Protocol key initialization...');
    //     const keysGenerated = await ensureSignalKeysExist();
    //     
    //     if (keysGenerated) {
    //       console.log('✅ New Signal Protocol keys generated for user');
    //     } else {
    //       console.log('✅ Signal Protocol keys already exist');
    //     }
    //     
    //     setIsInitialized(true);
    //     setError(null);
    //   } catch (err) {
    //     console.error('Failed to initialize Signal Protocol keys:', err);
    //     setError(err instanceof Error ? err : new Error('Unknown error'));
    //     setIsInitialized(false);
    //   }
    // };
    // initKeys();
  }, [isAuthenticated, user?.id]);

  return {
    isInitialized,
    error,
  };
}
