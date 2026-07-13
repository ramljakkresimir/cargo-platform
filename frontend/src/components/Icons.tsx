interface IconProps {
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function HomeIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 11L12 4L20 11V20H14V14H10V20H4V11Z" />
    </svg>
  );
}

export function SearchIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21L16.65 16.65" />
    </svg>
  );
}

export function PlusIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5V19M5 12H19" />
    </svg>
  );
}

export function GridIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export function TruckIcon({ size = 24, className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" className={className}>
      <rect x="4" y="16" width="24" height="14" rx="2" />
      <path d="M28 20H38L44 26V30H28V20Z" />
      <circle cx="14" cy="32" r="4" />
      <circle cx="36" cy="32" r="4" />
    </svg>
  );
}

export function PackageIcon({ size = 24, className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" className={className}>
      <path d="M6 14L24 6L42 14V34L24 42L6 34V14Z" />
      <path d="M6 14L24 22L42 14" />
      <path d="M24 22V42" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 9L12 15L18 9" />
    </svg>
  );
}

export function MenuIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 6H21M3 12H21M3 18H21" />
    </svg>
  );
}

export function XIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M18 6L6 18M6 6L18 18" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12H19M19 12L13 6M19 12L13 18" />
    </svg>
  );
}
