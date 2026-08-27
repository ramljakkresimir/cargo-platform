import { useState } from 'react';
import { StarFilledIcon, StarIcon } from './Icons';

interface Props {
  value: number;
  onChange: (score: number) => void;
  size?: number;
  disabled?: boolean;
}

// Accessible star-rating input — no existing modal/picker primitive in this codebase to
// mirror, so this follows the standard accessible star-picker pattern: a radiogroup of
// five native buttons (keyboard-operable for free via button semantics), with a hover
// preview that falls back to the committed value on mouse-out.
export default function RatingPicker({ value, onChange, size = 24, disabled }: Props) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  return (
    <div className="rating-picker" role="radiogroup" aria-label="Vaša ocjena">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} od 5 zvjezdica`}
          className="rating-picker-star"
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHoverValue(n)}
          onMouseLeave={() => setHoverValue(null)}
        >
          {n <= displayValue ? <StarFilledIcon size={size} /> : <StarIcon size={size} />}
        </button>
      ))}
    </div>
  );
}
