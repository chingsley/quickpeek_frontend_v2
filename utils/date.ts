export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${day} ${month} • ${hours}:${minutes.toString().padStart(2, '0')}`;
};