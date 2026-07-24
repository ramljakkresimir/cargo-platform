import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavDropdown from './NavDropdown';
import { HomeIcon, SearchIcon, PlusIcon, GridIcon, TruckIcon, PackageIcon, MenuIcon, XIcon } from './Icons';

interface MenuItem {
  to: string;
  title: string;
  desc: string;
  iconClass: 'blue' | 'teal';
  icon: React.ReactNode;
}

const SEARCH_ITEMS: MenuItem[] = [
  { to: '/vehicles', title: 'Tražim prijevoz', desc: 'Pretražite dostupna vozila.', iconClass: 'blue', icon: <TruckIcon size={20} /> },
  { to: '/cargo', title: 'Tražim teret', desc: 'Pretražite dostupne terete.', iconClass: 'teal', icon: <PackageIcon size={20} /> },
];

const POST_ITEMS: MenuItem[] = [
  { to: '/cargo/new', title: 'Objavi teret', desc: 'Objavite teret za koji tražite prijevoz.', iconClass: 'teal', icon: <PackageIcon size={20} /> },
  { to: '/vehicles/new', title: 'Objavi slobodno vozilo', desc: 'Objavite rutu i slobodan kapacitet vozila.', iconClass: 'blue', icon: <TruckIcon size={20} /> },
];

function MenuItemRow({ item, onNavigate }: { item: MenuItem; onNavigate: () => void }) {
  return (
    <Link to={item.to} className="nav-dropdown-item" data-dropdown-item onClick={onNavigate}>
      <span className={`nav-dropdown-item-icon ${item.iconClass}`}>{item.icon}</span>
      <span className="nav-dropdown-item-text">
        <span className="nav-dropdown-item-title">{item.title}</span>
        <span className="nav-dropdown-item-desc">{item.desc}</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobilePostOpen, setMobilePostOpen] = useState(false);

  // Close the mobile drawer whenever the route changes. Adjusted during render
  // (React's recommended pattern for "reset state when a prop/value changes")
  // rather than in an effect, so it takes effect before the stale-open drawer paints.
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setMobileOpen(false);
    setMobileSearchOpen(false);
    setMobilePostOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const searchActive = ['/vehicles', '/cargo'].some((p) => location.pathname.startsWith(p) && !location.pathname.endsWith('/new'));
  const postActive = location.pathname === '/cargo/new' || location.pathname === '/vehicles/new';
  const homeActive = location.pathname === '/';
  const dashActive = location.pathname === '/dashboard';

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-logo-mark">
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path d="M6 14L24 6L42 14V34L24 42L6 34V14Z" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
            <path d="M6 14L24 22L42 14" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
          </svg>
        </span>
        <span className="navbar-wordmark">CargoConnect</span>
      </Link>

      <div className="navbar-center">
        <Link to="/" className={`nav-item${homeActive ? ' active' : ''}`}>
          <HomeIcon /> Početna
        </Link>

        <NavDropdown
          label="Pretraga"
          icon={<SearchIcon />}
          active={searchActive}
          renderPanel={(close) => (
            <>
              {SEARCH_ITEMS.map((item) => (
                <MenuItemRow key={item.to} item={item} onNavigate={close} />
              ))}
            </>
          )}
        />

        <NavDropdown
          label="Objavi"
          icon={<PlusIcon />}
          active={postActive}
          renderPanel={(close) => (
            <>
              {POST_ITEMS.map((item) => (
                <MenuItemRow key={item.to} item={item} onNavigate={close} />
              ))}
            </>
          )}
        />

        <Link to="/dashboard" className={`nav-item${dashActive ? ' active' : ''}`}>
          <GridIcon /> Nadzorna ploča
        </Link>
      </div>

      <div className="navbar-right">
        {user ? (
          <NavDropdown
            label={<span className="nav-user-avatar">{initials}</span>}
            align="right"
            triggerClassName="nav-user-trigger"
            showChevron
            ariaLabel={`Korisnički izbornik za ${user.firstName} ${user.lastName}`}
            renderPanel={(close) => (
              <>
                <Link to="/my-posts" className="nav-dropdown-simple-item" data-dropdown-item onClick={close}>Moje objave</Link>
                <Link to="/company" className="nav-dropdown-simple-item" data-dropdown-item onClick={close}>Profil tvrtke</Link>
                <Link to="/profile" className="nav-dropdown-simple-item" data-dropdown-item onClick={close}>Profil</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="nav-dropdown-simple-item" data-dropdown-item onClick={close}>Administracija</Link>
                )}
                <div className="nav-dropdown-divider" />
                <button
                  type="button"
                  className="nav-dropdown-simple-item danger"
                  data-dropdown-item
                  onClick={() => { close(); handleLogout(); }}
                >
                  Odjava
                </button>
              </>
            )}
          />
        ) : (
          <>
            <Link to="/login" className="navbar-login-link">Prijava</Link>
            <Link to="/register" className="btn-primary-small">Registracija</Link>
          </>
        )}

        <button
          type="button"
          className="navbar-mobile-toggle"
          aria-label={mobileOpen ? 'Zatvori izbornik' : 'Otvori izbornik'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {mobileOpen && (
        <>
          <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)} />
          <div className="mobile-drawer">
            <Link to="/" className={`mobile-drawer-item${homeActive ? ' active' : ''}`}>
              <HomeIcon /> Početna
            </Link>

            <button
              type="button"
              className={`mobile-drawer-item${searchActive ? ' active' : ''}`}
              aria-expanded={mobileSearchOpen}
              onClick={() => setMobileSearchOpen((o) => !o)}
            >
              <SearchIcon /> Pretraga
            </button>
            {mobileSearchOpen && (
              <div className="mobile-submenu">
                {SEARCH_ITEMS.map((item) => (
                  <Link key={item.to} to={item.to} className="mobile-submenu-item">{item.title}</Link>
                ))}
              </div>
            )}

            <button
              type="button"
              className={`mobile-drawer-item${postActive ? ' active' : ''}`}
              aria-expanded={mobilePostOpen}
              onClick={() => setMobilePostOpen((o) => !o)}
            >
              <PlusIcon /> Objavi
            </button>
            {mobilePostOpen && (
              <div className="mobile-submenu">
                {POST_ITEMS.map((item) => (
                  <Link key={item.to} to={item.to} className="mobile-submenu-item">{item.title}</Link>
                ))}
              </div>
            )}

            <Link to="/dashboard" className={`mobile-drawer-item${dashActive ? ' active' : ''}`}>
              <GridIcon /> Nadzorna ploča
            </Link>

            <div className="mobile-drawer-divider" />

            {user ? (
              <>
                <Link to="/my-posts" className="mobile-drawer-item">Moje objave</Link>
                <Link to="/company" className="mobile-drawer-item">Profil tvrtke</Link>
                <Link to="/profile" className="mobile-drawer-item">Profil</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="mobile-drawer-item">Administracija</Link>
                )}
                <button type="button" className="mobile-drawer-item" style={{ color: 'var(--color-danger)' }} onClick={handleLogout}>
                  Odjava
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-drawer-item">Prijava</Link>
                <Link to="/register" className="mobile-drawer-item" style={{ color: 'var(--color-blue)' }}>Registracija</Link>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
