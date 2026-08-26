export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('hr-HR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toLocalDateString(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

// Local calendar date (not UTC) — same convention the backend uses for date-only comparisons.
export function todayLocalDateString(): string {
  return toLocalDateString(new Date());
}

export function addDaysLocalDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toLocalDateString(new Date(y, m - 1, d + days));
}

// "Objavljeno danas u 09:14" / "Objavljeno jučer" / "Objavljeno 26. kol 2026." for anything older.
export function formatPostedAt(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(created)) / 86_400_000);

  if (diffDays === 0) {
    const time = created.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `Objavljeno danas u ${time}`;
  }
  if (diffDays === 1) {
    return 'Objavljeno jučer';
  }
  return `Objavljeno ${formatDate(createdAt)}`;
}
