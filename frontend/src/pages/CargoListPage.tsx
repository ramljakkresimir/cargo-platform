import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { cargoPostsService } from '../services/cargoPosts.service';
import { CargoPost, PaginatedResult } from '../types';
import { useAuth } from '../context/AuthContext';

const LIMIT = 10;

const emptyFilters = {
  loadingLocation: '',
  unloadingLocation: '',
  loadingDate: '',
  cargoType: '',
  requiredVehicleType: '',
};

export default function CargoListPage() {
  const { token } = useAuth();

  // Display state for the filter form inputs
  const [filters, setFilters] = useState(emptyFilters);
  // Committed filters — updated only on Search/Clear; triggers the fetch effect
  const [activeFilters, setActiveFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedResult<CargoPost> | null>(null);
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
      const res = await cargoPostsService.getAll({ ...clean, page, limit: LIMIT });
      setResult(res.data);
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
        <h1>Cargo Posts</h1>
        {token && (
          <Link to="/cargo/new" className="btn-primary">+ Post Cargo</Link>
        )}
      </div>

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
        <>
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
