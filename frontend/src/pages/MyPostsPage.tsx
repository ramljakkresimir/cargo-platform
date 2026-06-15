import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cargoPostsService } from '../services/cargoPosts.service';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { CargoPost, VehiclePost } from '../types';

export default function MyPostsPage() {
  const navigate = useNavigate();

  const [cargoPosts, setCargoPosts] = useState<CargoPost[]>([]);
  const [vehiclePosts, setVehiclePosts] = useState<VehiclePost[]>([]);
  const [cargoLoading, setCargoLoading] = useState(true);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [cargoError, setCargoError] = useState('');
  const [vehicleError, setVehicleError] = useState('');

  useEffect(() => {
    fetchCargoPosts();
    fetchVehiclePosts();
  }, []);

  const fetchCargoPosts = async () => {
    try {
      const res = await cargoPostsService.getMine();
      setCargoPosts(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setCargoPosts([]);
      } else {
        setCargoError('Failed to load cargo posts.');
      }
    } finally {
      setCargoLoading(false);
    }
  };

  const fetchVehiclePosts = async () => {
    try {
      const res = await vehiclePostsService.getMine();
      setVehiclePosts(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setVehiclePosts([]);
      } else {
        setVehicleError('Failed to load vehicle posts.');
      }
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleDeleteCargo = async (id: string) => {
    if (!confirm('Delete this cargo post?')) return;
    try {
      await cargoPostsService.remove(id);
      setCargoPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setCargoError('Failed to delete cargo post.');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Delete this vehicle post?')) return;
    try {
      await vehiclePostsService.remove(id);
      setVehiclePosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setVehicleError('Failed to delete vehicle post.');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Posts</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
            All cargo and vehicle posts you have published
          </p>
        </div>
        <div className="action-buttons">
          <Link to="/cargo/new" className="btn-secondary">+ Post Cargo</Link>
          <Link to="/vehicles/new" className="btn-primary">+ Post Vehicle</Link>
        </div>
      </div>

      {/* ── Cargo Posts ──────────────────────────────────────────────── */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 16 }}>My Cargo Posts</h2>

        {cargoError && <div className="alert alert-error">{cargoError}</div>}

        {cargoLoading ? (
          <p className="loading">Loading...</p>
        ) : cargoPosts.length === 0 ? (
          <div className="empty-state">
            <p>You have no cargo posts yet.</p>
            <Link to="/cargo/new" className="btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
              Post Cargo
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Loading Date</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cargoPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <strong>{post.loadingLocation}</strong>
                      <span style={{ color: '#9ca3af', margin: '0 6px' }}>→</span>
                      <strong>{post.unloadingLocation}</strong>
                    </td>
                    <td>{post.loadingDate}</td>
                    <td>
                      <span className={`status-badge status-${post.status}`}>{post.status}</span>
                    </td>
                    <td style={{ color: '#6b7280' }}>{formatDate(post.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/cargo/${post.id}`} className="table-link">View</Link>
                        <button
                          className="table-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onClick={() => navigate(`/cargo/${post.id}`, { state: { startEditing: true } })}
                        >
                          Edit
                        </button>
                        <button
                          className="table-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#dc2626' }}
                          onClick={() => handleDeleteCargo(post.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Vehicle Posts ─────────────────────────────────────────────── */}
      <section>
        <h2 style={{ marginBottom: 16 }}>My Vehicle Posts</h2>

        {vehicleError && <div className="alert alert-error">{vehicleError}</div>}

        {vehicleLoading ? (
          <p className="loading">Loading...</p>
        ) : vehiclePosts.length === 0 ? (
          <div className="empty-state">
            <p>You have no vehicle posts yet.</p>
            <Link to="/vehicles/new" className="btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
              Post Vehicle
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Vehicle Type</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehiclePosts.map((post) => (
                  <tr key={post.id}>
                    <td><strong>{post.availableLocation}</strong></td>
                    <td>{post.vehicleType.replace(/_/g, ' ')}</td>
                    <td style={{ color: '#6b7280' }}>{post.destinationPreference || '—'}</td>
                    <td>
                      <span className={`status-badge status-${post.status}`}>{post.status}</span>
                    </td>
                    <td style={{ color: '#6b7280' }}>{formatDate(post.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/vehicles/${post.id}`} className="table-link">View</Link>
                        <button
                          className="table-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onClick={() => navigate(`/vehicles/${post.id}`, { state: { startEditing: true } })}
                        >
                          Edit
                        </button>
                        <button
                          className="table-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#dc2626' }}
                          onClick={() => handleDeleteVehicle(post.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
