import { useEffect, useState } from 'react';

/**
 * A custom hook to debounce any fast-changing value.
 * @param value The value to debounce (e.g., search text)
 * @param delay The debounce delay in milliseconds
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes (e.g., user keeps typing)
    // or if the component unmounts.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run if value or delay changes

  return debouncedValue;
}

export default useDebounce;