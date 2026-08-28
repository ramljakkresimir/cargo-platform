import { DetailChip } from './types';

interface Props {
  title: string;
  body?: string | null;
  chips: DetailChip[];
}

// Hides entirely when there's no note text — no empty card, no placeholder copy.
export default function NotesCard({ title, body, chips }: Props) {
  if (!body) return null;

  return (
    <div className="detail-card detail-notes-card">
      <h2 className="detail-card-title">{title}</h2>
      <p className="detail-notes-body">{body}</p>
      {chips.length > 0 && (
        <div className="detail-chips">
          {chips.map((chip, i) => (
            <span key={i} className={`detail-chip${chip.tone === 'accent' ? ' accent' : ''}`}>
              {chip.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
