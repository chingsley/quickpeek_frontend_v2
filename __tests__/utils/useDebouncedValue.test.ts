import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from '@/utils/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('halifa', 500));
    expect(result.current).toBe('halifa');
  });

  it('updates only after the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 500),
      { initialProps: { value: 'h' } },
    );

    rerender({ value: 'halifa' });
    expect(result.current).toBe('h');

    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current).toBe('h');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('halifa');
  });

  it('resets the timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 500),
      { initialProps: { value: '' } },
    );

    rerender({ value: 'h' });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    rerender({ value: 'ha' });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(result.current).toBe('');

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('ha');
  });
});
