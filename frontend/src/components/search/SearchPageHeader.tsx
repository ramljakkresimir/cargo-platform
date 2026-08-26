import { Link } from 'react-router-dom';
import NavDropdown from '../NavDropdown';
import { MoreIcon } from '../Icons';
import { SearchAccent } from './types';

interface Props {
  accent: SearchAccent;
  pillLabel: string;
  title: string;
  primaryLabel: string;
  primaryHref: string;
}

// "Sačuvaj pretragu" isn't backed by a saved-search feature anywhere in the app yet —
// render it as a real, focusable control (not a dead-looking link) but be honest that
// it doesn't persist anything yet, via a native tooltip, rather than faking success.
const SAVE_SEARCH_TITLE = 'Spremanje pretraga uskoro dostupno';

export default function SearchPageHeader({ accent, pillLabel, title, primaryLabel, primaryHref }: Props) {
  return (
    <>
      <div className={`search-header accent-${accent}`}>
        <div className="search-header-text">
          <span className="search-header-pill">{pillLabel}</span>
          <h1 className="search-header-title">{title}</h1>
        </div>

        <div className="search-header-actions">
          <button type="button" className="search-btn-save" title={SAVE_SEARCH_TITLE}>
            Sačuvaj pretragu
          </button>
          <Link to={primaryHref} className={`search-btn-primary accent-${accent}`}>
            {primaryLabel}
          </Link>
        </div>

        <div className="search-header-mobile-menu">
          <NavDropdown
            label={<MoreIcon size={18} />}
            showChevron={false}
            align="right"
            ariaLabel="Više opcija"
            triggerClassName="search-header-more-trigger"
            renderPanel={(close) => (
              <button
                type="button"
                className="nav-dropdown-simple-item"
                title={SAVE_SEARCH_TITLE}
                onClick={close}
              >
                Sačuvaj pretragu
              </button>
            )}
          />
        </div>
      </div>

      {/* Mobile-only sticky CTA — the primary "+ Objavi …" action moves here below 640px */}
      <div className="search-mobile-cta-bar">
        <Link to={primaryHref} className={`search-btn-primary accent-${accent}`}>
          {primaryLabel}
        </Link>
      </div>
    </>
  );
}
