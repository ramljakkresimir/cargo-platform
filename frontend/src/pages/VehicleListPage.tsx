import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { VehiclePost, PaginatedResult } from '../types';
import { useAuth } from '../context/AuthContext';

const LIMIT = 10;

const emptyFilters = {
  availableLocation: '',
  availableFromDate: '',
  vehicleType: '',
  destinationPreference: '',
};

export default function VehicleListPage() {
  const { token } = useAuth();

  const [filters, setFilters] = useState(emptyFilters);
  const [activeFilters, setActiveFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedResult<VehiclePost> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [activeFilters, page]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const clean = Object.fromEntries(
        Object.entries(activeFilters).filter(([, v]) => v !== '')
      );
      const res = await vehiclePostsService.getAll({ ...clean, page, limit: LIMIT });
      setResult(res.data);
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
    setPage(1);
    setActiveFilters({ ...filters });
  };

  const handleClear = () => {
    setFilters(emptyFilters);
    setPage(1);
    setActiveFilters(emptyFilters);
  };

  const posts = result?.data ?? [];

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
        <>
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

          {result && result.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {result.page} of {result.totalPages} &nbsp;·&nbsp; {result.total} results
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= result.totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
