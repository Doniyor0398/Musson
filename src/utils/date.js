const pad = (n) => String(n).padStart(2, '0');

export function formatDate(date) {
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${d}.${m}.${y}, ${hh}:${mm}`;
}

export function formatShort(date) {
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${d}.${m}.${y} ${hh}:${mm}`;
}

export function toDateTimeLocal(date) {
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function calculateExpiration(startDate, hours) {
  const d = new Date(startDate);
  if (isNaN(d)) return null;
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}
