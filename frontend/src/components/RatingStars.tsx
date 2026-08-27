import { StarFilledIcon, StarIcon } from './Icons';

interface Props {
  average: number | null;
  count: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

// A single star cell rendered independently — fully empty, fully filled, or (for at most
// one cell, the boundary star) partially filled via a clip on its own fixed-size box.
// Each cell is sized in real pixels (not a percentage of a shared multi-star row), so the
// clip never has to account for inter-star gaps, and — critically — is never a flex
// container being squeezed to a narrow width, which is what caused the previous
// whole-row-overlay approach to smear a faint gold tint across all 5 stars instead of a
// clean split (the browser's default flex-shrink squishes flex children to fit a
// narrowed container rather than letting overflow:hidden clip them).
function StarCell({ fraction, size }: { fraction: number; size: number }) {
  if (fraction <= 0) return <StarIcon size={size} />;
  if (fraction >= 1) return <StarFilledIcon size={size} />;
  return (
    <span className="rating-star-cell" style={{ width: size, height: size }}>
      <StarIcon size={size} className="rating-star-cell-empty" />
      <span className="rating-star-cell-fill" style={{ width: `${fraction * 100}%` }}>
        <StarFilledIcon size={size} />
      </span>
    </span>
  );
}

// Reusable read-only rating display — 5 independently-rendered stars, gold up to the
// exact fractional average. When there are no ratings yet, shows a muted note instead of
// an all-gray star row, which would otherwise misleadingly read as "worst possible score"
// rather than "not yet rated."
export default function RatingStars({ average, count, size = 16, showLabel = true, className }: Props) {
  if (average == null || count === 0) {
    return (
      <span className={`rating-stars-none${className ? ` ${className}` : ''}`}>
        Još nema ocjena
      </span>
    );
  }

  const label = `Ocjena ${average.toFixed(1)} od 5 zvjezdica (${count})`;

  return (
    <span
      className={`rating-stars${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={label}
    >
      <span className="rating-stars-row" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <StarCell key={n} fraction={Math.max(0, Math.min(1, average - (n - 1)))} size={size} />
        ))}
      </span>
      {showLabel && (
        <span className="rating-stars-label">
          {average.toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}
