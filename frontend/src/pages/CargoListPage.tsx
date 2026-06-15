import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { cargoPostsService } from '../services/cargoPosts.service';
import { CargoPost } from '../types';
import { useAuth } from '../context/AuthContext';

export default function CargoListPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<CargoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    loadingLocation: '',
    unloadingLocation: '',
    loadingDate: '',
    cargoType: '',
    requiredVehicleType: '',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (activeFilters = {}) => {
    setLoading(true);
    setError('');
    try {
      // Remove empty filter values before sending to the API
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([, v]) => v !== '')
      );
      const res = await cargoPostsService.getAll(cleanFilters);
      setPosts(res.data);
    } catch {
      setError('Failed to load cargo posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchPosts(filters);
  };

  const handleClear = () => {
    const empty = { loadingLocation: '', unloadingLocation: '', loadingDate: '', cargoType: '', requiredVehicleType: '' };
    setFilters(empty);
    fetchPosts({});
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Cargo Posts</h1>
        {token && (
          <Link to="/cargo/new" className="btn-primary">+ Post Cargo</Link>
        )}
      </div>

      {/* Search filters */}
      <div className="filter-card">
        <form onSubmit={handleSearch}>
          <div className="filter-grid">
            <div className="form-group">
              <label>Loading Location</label>
              <input name="loadingLocation" value={filters.loadingLocation} onChange={handleFilterChange} placeholder="e.g. Sarajevo" />
            </div>
            <div className="form-group">
              <label>Unloading Location</label>
              <input name="unloadingLocation" value={filters.unloadingLocation} onChange={handleFilterChange} placeholder="e.g. Zagreb" />
            </div>
            <div className="form-group">
              <label>Loading Date</label>
              <input type="date" name="loadingDate" value={filters.loadingDate} onChange={handleFilterChange} />
            </div>
            <div className="form-group">
              <label>Cargo Type</label>
              <input name="cargoType" value={filters.cargoType} onChange={handleFilterChange} placeholder="e.g. general" />
            </div>
            <div className="form-group">
              <label>Vehicle Type</label>
              <input name="requiredVehicleType" value={filters.requiredVehicleType} onChange={handleFilterChange} placeholder="e.g. truck" />
            </div>
          </div>
          <div className="filter-actions">
            <button type="submit" className="btn-primary">Search</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>Clear</button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Loading posts...</div>}

      {!loading && posts.length === 0 && (
        <div className="empty-state">No cargo posts found. Try adjusting your filters.</div>
      )}

      {!loading && posts.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Date</th>
                <th>Cargo Type</th>
                <th>Weight (t)</th>
                <th>Vehicle</th>
                <th>Price (€)</th>
                <th>Company</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.loadingLocation}</td>
                  <td>{post.unloadingLocation}</td>
                  <td>{post.loadingDate}</td>
                  <td>{post.cargoType || '—'}</td>
                  <td>{post.weight || '—'}</td>
                  <td>{post.requiredVehicleType || '—'}</td>
                  <td>{post.price ? `€${post.price}` : '—'}</td>
                  <td>{post.company?.companyName || '—'}</td>
                  <td>
                    <Link to={`/cargo/${post.id}`} className="table-link">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
