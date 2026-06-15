import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { VehiclePost } from '../types';
import { useAuth } from '../context/AuthContext';

export default function VehicleListPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<VehiclePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    availableLocation: '',
    availableFromDate: '',
    vehicleType: '',
    destinationPreference: '',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (activeFilters = {}) => {
    setLoading(true);
    setError('');
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([, v]) => v !== '')
      );
      const res = await vehiclePostsService.getAll(cleanFilters);
      setPosts(res.data);
    } catch {
      setError('Failed to load vehicle posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchPosts(filters);
  };

  const handleClear = () => {
    const empty = { availableLocation: '', availableFromDate: '', vehicleType: '', destinationPreference: '' };
    setFilters(empty);
    fetchPosts({});
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Available Vehicles</h1>
        {token && (
          <Link to="/vehicles/new" className="btn-primary">+ Post Vehicle</Link>
        )}
      </div>

      <div className="filter-card">
        <form onSubmit={handleSearch}>
          <div className="filter-grid">
            <div className="form-group">
              <label>Available Location</label>
              <input name="availableLocation" value={filters.availableLocation} onChange={handleFilterChange} placeholder="e.g. Banja Luka" />
            </div>
            <div className="form-group">
              <label>Available From</label>
              <input type="date" name="availableFromDate" value={filters.availableFromDate} onChange={handleFilterChange} />
            </div>
            <div className="form-group">
              <label>Vehicle Type</label>
              <input name="vehicleType" value={filters.vehicleType} onChange={handleFilterChange} placeholder="e.g. truck" />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <input name="destinationPreference" value={filters.destinationPreference} onChange={handleFilterChange} placeholder="e.g. Germany" />
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
        <div className="empty-state">No vehicle posts found. Try adjusting your filters.</div>
      )}

      {!loading && posts.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Available From</th>
                <th>Vehicle Type</th>
                <th>Capacity (t)</th>
                <th>Destination</th>
                <th>Company</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.availableLocation}</td>
                  <td>{post.availableFromDate}</td>
                  <td>{post.vehicleType}</td>
                  <td>{post.capacity || '—'}</td>
                  <td>{post.destinationPreference || '—'}</td>
                  <td>{post.company?.companyName || '—'}</td>
                  <td>
                    <Link to={`/vehicles/${post.id}`} className="table-link">View</Link>
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
