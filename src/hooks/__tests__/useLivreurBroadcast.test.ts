import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLivreurBroadcast } from '@/hooks/useLivreurBroadcast';

const pushMock = vi.fn();
vi.mock('@/lib/api', () => ({
  livreurPositionApi: { push: (...args: unknown[]) => pushMock(...args) },
}));

type PositionSuccess = (position: { coords: { latitude: number; longitude: number } }) => void;

describe('useLivreurBroadcast', () => {
  let successCallback: PositionSuccess | undefined;
  const clearWatchMock = vi.fn();
  const watchPositionMock = vi.fn((success: PositionSuccess) => {
    successCallback = success;
    return 1;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    pushMock.mockReset();
    pushMock.mockResolvedValue({});
    successCallback = undefined;
    watchPositionMock.mockClear();
    clearWatchMock.mockClear();
    Object.defineProperty(global.navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition: watchPositionMock, clearWatch: clearWatchMock },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not watch or push when disabled', () => {
    renderHook(() => useLivreurBroadcast(false));
    expect(watchPositionMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20000);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('watches the position once enabled', () => {
    renderHook(() => useLivreurBroadcast(true, 'DELIVERY', 42));
    expect(watchPositionMock).toHaveBeenCalledTimes(1);
  });

  it('does not push before a position is known', () => {
    renderHook(() => useLivreurBroadcast(true));
    vi.advanceTimersByTime(12000);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('pushes the last known position every 12s once available', () => {
    renderHook(() => useLivreurBroadcast(true, 'DELIVERY', 42));
    successCallback?.({ coords: { latitude: 9.5, longitude: -13.6 } });

    vi.advanceTimersByTime(12000);
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith({
      latitude: 9.5, longitude: -13.6, order_type: 'DELIVERY', order_id: 42,
    });

    vi.advanceTimersByTime(12000);
    expect(pushMock).toHaveBeenCalledTimes(2);
  });

  it('clears the geolocation watch on unmount', () => {
    const { unmount } = renderHook(() => useLivreurBroadcast(true));
    unmount();
    expect(clearWatchMock).toHaveBeenCalledWith(1);
  });
});
