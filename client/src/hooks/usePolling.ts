import { useEffect, useRef } from "react";

/**
 * Custom hook für Polling mit Change-Detection
 * Ruft eine Funktion nur auf, wenn sich die Daten geändert haben
 * @param fetchFn - Funktion die die Daten abruft
 * @param intervalMs - Polling-Intervall in Millisekunden (default: 5 Minuten)
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number = 5 * 60 * 1000 // 5 Minuten default
) {
  const lastDataRef = useRef<T | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const newData = await fetchFn();
        
        // Vergleiche mit letzten Daten
        const dataChanged = JSON.stringify(lastDataRef.current) !== JSON.stringify(newData);
        
        if (dataChanged) {
          lastDataRef.current = newData;
          // Daten haben sich geändert - wird durch den Caller verarbeitet
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Erste Abfrage sofort
    poll();

    // Dann alle intervalMs
    intervalRef.current = setInterval(poll, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchFn, intervalMs]);
}
