import { useEffect, useRef } from 'react';

/**
 * setInterval déclaratif : garde toujours la dernière version du callback
 * (via une ref) sans redémarrer le minuteur à chaque render, contrairement à
 * un useEffect([callback, delay]) naïf.
 */
export function useInterval(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
