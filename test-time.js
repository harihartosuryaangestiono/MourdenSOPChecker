function formatTime(date) {
  if (!date) return "";
  if (typeof date === 'string') {
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(date)) {
      const parts = date.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date";
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
console.log(formatTime("08:00:00"));
console.log(formatTime("12:00"));
console.log(formatTime("invalid"));
