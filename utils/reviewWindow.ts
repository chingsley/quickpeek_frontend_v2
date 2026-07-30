import { useEffect, useState } from 'react';

/** Human-readable time left before the review window closes. */
export const formatReviewWindowRemaining = (endsAt: string, now = new Date()): string | null => {
  const diffMs = new Date(endsAt).getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days >= 1) {
    return days === 1 ? '1 day left to review' : `${days} days left to review`;
  }
  if (hours >= 1) {
    return hours === 1 ? '1 hour left to review' : `${hours} hours left to review`;
  }
  if (minutes >= 1) {
    return minutes === 1 ? '1 minute left to review' : `${minutes} minutes left to review`;
  }
  return 'Less than 1 minute left to review';
};

type ReviewWindowCountdownOptions = {
  endsAt: string | null;
  windowOpen: boolean;
  onWindowExpired?: () => void;
};

/** Live countdown label; calls `onWindowExpired` when the window closes. */
export const useReviewWindowCountdown = ({
  endsAt,
  windowOpen,
  onWindowExpired,
}: ReviewWindowCountdownOptions) => {
  const [remaining, setRemaining] = useState<string | null>(() =>
    endsAt && windowOpen ? formatReviewWindowRemaining(endsAt) : null,
  );
  const [ended, setEnded] = useState(!windowOpen);

  useEffect(() => {
    if (!endsAt || !windowOpen) {
      setEnded(!windowOpen);
      setRemaining(null);
      return;
    }

    let expired = false;

    const tick = () => {
      const label = formatReviewWindowRemaining(endsAt);
      if (!label) {
        if (!expired) {
          expired = true;
          onWindowExpired?.();
        }
        setEnded(true);
        setRemaining(null);
        return;
      }
      setEnded(false);
      setRemaining(label);
    };

    tick();

    const msLeft = new Date(endsAt).getTime() - Date.now();
    const intervalMs = msLeft <= 60 * 60 * 1000 ? 1000 : 60 * 1000;
    const interval = setInterval(tick, intervalMs);
    const exactTimeout = msLeft > 0 ? setTimeout(tick, msLeft) : null;

    return () => {
      clearInterval(interval);
      if (exactTimeout) clearTimeout(exactTimeout);
    };
  }, [endsAt, onWindowExpired, windowOpen]);

  return { remaining, ended };
};
