export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${day} ${month} • ${hours}:${minutes.toString().padStart(2, '0')}`;
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