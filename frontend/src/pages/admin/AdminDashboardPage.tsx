import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { extractErrorMessage } from '../../utils/errorUtils';

interface Stats {
  totalUsers: number;
  totalCargoPosts: number;
  totalVehiclePosts: number;
  activeCargoPosts: number;
  activeVehiclePosts: number;
}

interface ExpiredCount {
  cargoPostsExpired: number;
  vehiclePostsExpired: number;
  total: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expiredCount, setExpiredCount] = useState<ExpiredCount | null>(null);
  const [closingExpired, setClosingExpired] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  const fetchExpiredCount = () => {
    adminService
      .getExpiredPostsCount()
      .then((res) => setExpiredCount(res.data))
      .catch(() => {
        // Non-critical — the bulk action button just stays disabled/hidden without a count
      });
  };

  useEffect(() => {
    adminService
      .getStats()
      .then((res) => setStats(res.data))
      .catch(() => setError('Učitavanje statistike nije uspjelo.'))
      .finally(() => setLoading(false));
    fetchExpiredCount();
  }, []);

  const handleCloseExpired = async () => {
    if (!expiredCount || expiredCount.total === 0) return;
    if (
      !window.confirm(
        `Zatvoriti ${expiredCount.total} isteklih oglasa (${expiredCount.cargoPostsExpired} tereta, ${expiredCount.vehiclePostsExpired} vozila)? Ova radnja se ne može poništiti.`,
      )
    ) {
      return;
    }
    setBulkError('');
    setBulkSuccess('');
    setClosingExpired(true);
    try {
      const res = await adminService.closeExpiredPosts();
      setBulkSuccess(
        `Zatvoreno ${res.data.totalClosed} isteklih oglasa (${res.data.cargoPostsClosed} tereta, ${res.data.vehiclePostsClosed} vozila).`,
      );
      fetchExpiredCount();
      adminService.getStats().then((res2) => setStats(res2.data)).catch(() => {});
    } catch (err) {
      setBulkError(extractErrorMessage(err, 'Zatvaranje isteklih oglasa nije uspjelo.'));
    } finally {
      setClosingExpired(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Administracija</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Učitavanje statistike...</div>}

      {stats && (
        <div className="dashboard-grid stat-grid">
          <div className="dashboard-card">
            <h3>Ukupno korisnika</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
          <div className="dashboard-card">
            <h3>Oglasi tereta</h3>
            <p className="stat-value stat-value-with-delta">{stats.totalCargoPosts}</p>
            <p className="stat-delta">{stats.activeCargoPosts} aktivno</p>
          </div>
          <div className="dashboard-card">
            <h3>Oglasi vozila</h3>
            <p className="stat-value stat-value-with-delta">{stats.totalVehiclePosts}</p>
            <p className="stat-delta">{stats.activeVehiclePosts} aktivno</p>
          </div>
        </div>
      )}

      {bulkSuccess && <div className="alert alert-success">{bulkSuccess}</div>}
      {bulkError && <div className="alert alert-error">{bulkError}</div>}

      <div className="dashboard-card" style={{ marginBottom: 24 }}>
        <h3>Skupne radnje</h3>
        <p>
          {expiredCount
            ? `${expiredCount.total} isteklih oglasa (${expiredCount.cargoPostsExpired} tereta, ${expiredCount.vehiclePostsExpired} vozila) čeka zatvaranje.`
            : 'Zatvorite sve istekle oglase tereta i vozila u jednom koraku.'}
        </p>
        <button
          className="btn-secondary"
          onClick={handleCloseExpired}
          disabled={closingExpired || !expiredCount || expiredCount.total === 0}
        >
          {closingExpired ? 'Zatvaranje...' : 'Zatvori sve istekle oglase'}
        </button>
      </div>

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
