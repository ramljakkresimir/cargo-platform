import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">CargoConnect BiH</Link>
      </div>

      <div className="navbar-links">
        <Link to="/cargo">Cargo</Link>
        <Link to="/vehicles">Vehicles</Link>

        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/my-posts">My Posts</Link>
            <Link to="/company">Company</Link>
            <Link to="/profile">Profile</Link>
            <button className="btn-link" onClick={handleLogout}>
              Logout ({user.firstName})
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-primary-small">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
