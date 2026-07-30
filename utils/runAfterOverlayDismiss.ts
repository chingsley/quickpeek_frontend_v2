import { OVERLAY_DISMISS_HANDOFF_MS } from '@/constants/bottomSheet';
import { Platform } from 'react-native';

/**
 * Run `action` after the current native Modal has unmounted.
 * Two rAFs let React commit the dismiss; Android gets a tiny extra buffer
 * for the native modal layer to release before opening a bottom sheet.
 */
export function runAfterOverlayDismiss(action: () => void): () => void {
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const run = () => {
    if (cancelled) return;
    action();
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (cancelled) return;
      if (Platform.OS === 'android') {
        timeoutId = setTimeout(run, OVERLAY_DISMISS_HANDOFF_MS);
        return;
      }
      run();
    });
  });

  return () => {
    cancelled = true;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };
}
