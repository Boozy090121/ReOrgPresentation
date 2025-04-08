import { useState, useEffect } from 'react';

/**
 * Custom hook that returns true once the component has mounted on the client.
 * Useful for preventing SSR/build-time execution of client-only logic.
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
} 