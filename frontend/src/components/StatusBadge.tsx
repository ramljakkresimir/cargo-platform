const LABELS: Record<string, string> = {
  active: 'Aktivno',
  closed: 'Zatvoreno',
  expired: 'Isteklo',
};

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`status-badge status-${status}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
