interface Props {
  name?: string;
  className?: string;
}

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Static neutral placeholder tile — companies have no logo/photo upload yet.
// Swap in a real <img> here once uploads exist; callers don't need to change.
export default function CompanyAvatar({ name, className }: Props) {
  return (
    <div className={`company-avatar${className ? ` ${className}` : ''}`} aria-hidden="true">
      {getInitials(name)}
    </div>
  );
}
