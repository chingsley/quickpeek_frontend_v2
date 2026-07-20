export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${day} ${month} • ${hours}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Relative-time formatter for feed cards.
 * < 1 min → "just now"
 * < 60 min → "N minutes ago" / "1 minute ago"
 * < 24 h   → "N hours ago" / "1 hour ago"
 * < 7 d    → "N days ago" / "1 day ago"
 * >= 7 d   → absolute "20 Jul • 21:41"
 */
export const formatRelativeTime = (dateString: string, now: Date = new Date()) => {
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (days < 7) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  return formatDate(dateString);
};

export const formatListTime = (dateString: string) => {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

export const formatMessageTime = (dateString: string) => formatListTime(dateString);

export const formatDaySeparator = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return 'Yesterday';
  }

  const weekday = date.toLocaleString('default', { weekday: 'short' });
  const month = date.toLocaleString('default', { month: 'short' });
  return `${weekday}, ${month} ${date.getDate()}`;
};

export const getDayKey = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};