/**
 * Format "HH:MM" 24h string → "9:00 PM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Format an ISO timestamp as a relative label, e.g. "Today • 8:43 PM"
 */
export function formatLastSent(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now - 86400000).toDateString();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (d.toDateString() === today) return `Today • ${time}`;
  if (d.toDateString() === yesterday) return `Yesterday • ${time}`;
  return `${d.toLocaleDateString()} • ${time}`;
}

/**
 * Returns a greeting based on the current hour.
 */
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

/**
 * Generate a unique ID.
 */
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
