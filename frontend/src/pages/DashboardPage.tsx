import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PackageIcon, TruckIcon, SearchIcon } from '../components/Icons';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Nadzorna ploča</h1>
          <p className="page-subtitle">Dobrodošli natrag, {user?.firstName} {user?.lastName}. Evo što možete napraviti dalje.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-icon teal"><PackageIcon size={20} /></div>
          <h3>Objavi teret</h3>
          <p>Imate teret koji treba prijevoz? Objavite oglas i pronađite prijevoznika.</p>
          <Link to="/cargo/new" className="btn-secondary">Objavi teret</Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon blue"><TruckIcon size={20} /></div>
          <h3>Objavi slobodno vozilo</h3>
          <p>Imate slobodno vozilo? Objavite kapacitet i pronađite teret.</p>
          <Link to="/vehicles/new" className="btn-secondary">Objavi vozilo</Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon neutral"><SearchIcon size={20} /></div>
          <h3>Pretraži prijevoz</h3>
          <p>Pregledajte dostupna vozila i slobodan kapacitet.</p>
          <Link to="/vehicles" className="btn-secondary">Pretraži prijevoz</Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon neutral"><SearchIcon size={20} /></div>
          <h3>Pretraži teret</h3>
          <p>Pregledajte objave tereta tvrtki koje traže prijevoz.</p>
          <Link to="/cargo" className="btn-secondary">Pretraži teret</Link>
        </div>
      </div>

      <div className="dashboard-secondary-row">
        <Link to="/my-posts" className="btn-secondary">Moje objave</Link>
        <Link to="/company" className="btn-secondary">Profil tvrtke</Link>
        <Link to="/profile" className="btn-secondary">Profil</Link>
      </div>
    </div>
  );
}
