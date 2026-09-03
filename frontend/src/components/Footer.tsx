import { Link, useLocation } from 'react-router-dom';

// Real, in-app destinations.
const NAV_LINKS = [
  { to: '/', label: 'Početna' },
  { to: '/cargo', label: 'Tereti' },
  { to: '/vehicles', label: 'Vozila' },
];

// These pages don't exist yet. `to: null` renders a focusable, non-navigating <button>
// styled exactly like a footer link. When a page is added, set `to: '/o-nama'` (etc.) and
// the same entry renders a real <Link> — no other markup or CSS change needed.
const COMPANY_LINKS: { label: string; to: string | null }[] = [
  { label: 'O nama', to: null },
  { label: 'Kontakt', to: null },
];
const LEGAL_LINKS: { label: string; to: string | null }[] = [
  { label: 'Uvjeti korištenja', to: null },
  { label: 'Politika privatnosti', to: null },
  { label: 'Politika kolačića', to: null },
  { label: 'Pravne informacije', to: null },
];

const PLACEHOLDER_TITLE = 'Uskoro dostupno';

// The footer belongs on the public-facing pages only: the home page and the cargo/vehicle
// browse + detail pages. It stays off the auth screens (full-height centered layout), the
// logged-in application screens, the admin area, and the post-create forms.
function showFooterFor(pathname: string): boolean {
  if (pathname === '/' || pathname === '/cargo' || pathname === '/vehicles') return true;
  if (pathname === '/cargo/new' || pathname === '/vehicles/new') return false;
  return pathname.startsWith('/cargo/') || pathname.startsWith('/vehicles/');
}

function LinkOrPlaceholder({ label, to }: { label: string; to: string | null }) {
  if (to) {
    return (
      <Link to={to} className="site-footer-link">
        {label}
      </Link>
    );
  }
  return (
    <button type="button" className="site-footer-link" title={PLACEHOLDER_TITLE}>
      {label}
    </button>
  );
}

export default function Footer() {
  const { pathname } = useLocation();
  if (!showFooterFor(pathname)) return null;

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <span className="site-footer-wordmark">CargoConnect</span>
            <p className="site-footer-desc">
              CargoConnect povezuje prijevoznike i tvrtke koje traže prijevoz tereta.
              Izravan kontakt s drugom stranom, bez posrednika.
            </p>
          </div>

          <div className="site-footer-col">
            <h2 className="site-footer-col-title">Navigacija</h2>
            <nav className="site-footer-links" aria-label="Podnožje stranice">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} className="site-footer-link">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="site-footer-col">
            <h2 className="site-footer-col-title">Tvrtka</h2>
            <div className="site-footer-links">
              {COMPANY_LINKS.map((item) => (
                <LinkOrPlaceholder key={item.label} {...item} />
              ))}
            </div>
          </div>

          <div className="site-footer-col">
            <h2 className="site-footer-col-title">Pravno</h2>
            <div className="site-footer-links">
              {LEGAL_LINKS.map((item) => (
                <LinkOrPlaceholder key={item.label} {...item} />
              ))}
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          © {new Date().getFullYear()} CargoConnect. Sva prava pridržana.
        </div>
      </div>
    </footer>
  );
}
