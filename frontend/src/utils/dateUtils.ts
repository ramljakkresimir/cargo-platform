export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('hr-HR', { day: '2-digit', month: 'short', year: 'numeric' });
}
