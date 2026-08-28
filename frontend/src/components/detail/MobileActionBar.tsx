interface Props {
  primary: string;
  secondary: string;
  onContact: () => void;
}

// Sticky bottom bar shown only on mobile (<768px, via CSS) for non-owner viewers — a
// message CTA doesn't apply to a listing's own owner, so DetailView skips rendering this
// entirely in that case rather than showing a disabled/dead button.
export default function MobileActionBar({ primary, secondary, onContact }: Props) {
  return (
    <div className="detail-mobile-bar">
      <div className="detail-mobile-bar-summary">
        <span className="detail-mobile-bar-primary">{primary}</span>
        <span className="detail-mobile-bar-secondary">{secondary}</span>
      </div>
      <button type="button" className="detail-mobile-bar-btn" onClick={onContact}>
        Pošalji poruku
      </button>
    </div>
  );
}
