import RatingPicker from '../RatingPicker';

interface Props {
  score: number;
  onChange: (score: number) => void;
  disabled?: boolean;
  error?: string;
}

export default function CompanyRatingCard({ score, onChange, disabled, error }: Props) {
  return (
    <div className="detail-card detail-rating-card">
      <h2 className="detail-card-title">Vaša ocjena tvrtke</h2>
      <div className="detail-rating-card-row">
        <RatingPicker value={score} onChange={onChange} disabled={disabled} size={22} />
        <span className="detail-rating-card-score">{score > 0 ? `${score}/5` : 'Ocijenite'}</span>
      </div>
      <p className="detail-rating-card-hint">Ocjenu možete promijeniti nakon završenog prijevoza.</p>
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}
