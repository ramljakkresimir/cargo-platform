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
      .catch(() => setError('Failed to load stats.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Loading stats...</div>}

      {stats && (
        <div className="dashboard-grid" style={{ marginBottom: 32 }}>
          <div className="dashboard-card">
            <h3>Total Users</h3>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', marginBottom: 0 }}>
              {stats.totalUsers}
            </p>
          </div>
          <div className="dashboard-card">
            <h3>Cargo Posts</h3>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>
              {stats.totalCargoPosts}
            </p>
            <p style={{ fontSize: 13, color: '#16a34a', marginBottom: 0 }}>
              {stats.activeCargoPosts} active
            </p>
          </div>
          <div className="dashboard-card">
            <h3>Vehicle Posts</h3>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>
              {stats.totalVehiclePosts}
            </p>
            <p style={{ fontSize: 13, color: '#16a34a', marginBottom: 0 }}>
              {stats.activeVehiclePosts} active
            </p>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Manage Users</h3>
          <p>View, search, change roles, and delete user accounts.</p>
          <Link to="/admin/users" className="btn-primary">Go to Users</Link>
        </div>
        <div className="dashboard-card">
          <h3>Manage Cargo Posts</h3>
          <p>View all cargo posts, change status, or delete entries.</p>
          <Link to="/admin/cargo-posts" className="btn-primary">Go to Cargo Posts</Link>
        </div>
        <div className="dashboard-card">
          <h3>Manage Vehicle Posts</h3>
          <p>View all vehicle posts, change status, or delete entries.</p>
          <Link to="/admin/vehicle-posts" className="btn-primary">Go to Vehicle Posts</Link>
        </div>
      </div>
    </div>
  );
}
