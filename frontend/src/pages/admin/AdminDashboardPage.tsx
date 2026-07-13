import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';

interface Stats {
  totalUsers: number;
  totalCargoPosts: number;
  totalVehiclePosts: number;
  activeCargoPosts: number;
  activeVehiclePosts: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService
      .getStats()
      .then((res) => setStats(res.data))
      .catch(() => setError('Učitavanje statistike nije uspjelo.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Administracija</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Učitavanje statistike...</div>}

      {stats && (
        <div className="dashboard-grid" style={{ marginBottom: 32 }}>
          <div className="dashboard-card">
            <h3>Ukupno korisnika</h3>
            <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-blue)', marginBottom: 0 }}>
              {stats.totalUsers}
            </p>
          </div>
          <div className="dashboard-card">
            <h3>Oglasi tereta</h3>
            <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-blue)', marginBottom: 4 }}>
              {stats.totalCargoPosts}
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-success)', marginBottom: 0 }}>
              {stats.activeCargoPosts} aktivno
            </p>
          </div>
          <div className="dashboard-card">
            <h3>Oglasi vozila</h3>
            <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-blue)', marginBottom: 4 }}>
              {stats.totalVehiclePosts}
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-success)', marginBottom: 0 }}>
              {stats.activeVehiclePosts} aktivno
            </p>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Upravljanje korisnicima</h3>
          <p>Pregled, pretraga, promjena uloga i brisanje korisničkih računa.</p>
          <Link to="/admin/users" className="btn-primary">Korisnici</Link>
        </div>
        <div className="dashboard-card">
          <h3>Oglasi tereta</h3>
          <p>Pregled svih oglasa tereta, promjena statusa ili brisanje.</p>
          <Link to="/admin/cargo-posts" className="btn-primary">Oglasi tereta</Link>
        </div>
        <div className="dashboard-card">
          <h3>Oglasi vozila</h3>
          <p>Pregled svih oglasa vozila, promjena statusa ili brisanje.</p>
          <Link to="/admin/vehicle-posts" className="btn-primary">Oglasi vozila</Link>
        </div>
      </div>
    </div>
  );
}
