import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { cargoPostsService } from '../services/cargoPosts.service';
import { CargoPost, PaginatedResult, City } from '../types';
import { useAuth } from '../context/AuthContext';
import CityAutocomplete from '../components/CityAutocomplete';

const LIMIT = 10;

interface ActiveFilters {
  loadingCityId: string;
  unloadingCityId: string;
  loadingDate: string;
  cargoType: string;
  requiredVehicleType: string;
}

const emptyActiveFilters: ActiveFilters = {
  loadingCityId: '',
  unloadingCityId: '',
  loadingDate: '',
  cargoType: '',
  requiredVehicleType: '',
};

function cityLabel(post: CargoPost, type: 'loading' | 'unloading'): string {
  if (type === 'loading') {
    return post.loadingCity?.name || post.loadingLocation || '—';
  }
  return post.unloadingCity?.name || post.unloadingLocation || '—';
}

export default function CargoListPage() {
  const { token } = useAuth();

  const [loadingCityFilter, setLoadingCityFilter] = useState<City | null>(null);
  const [unloadingCityFilter, setUnloadingCityFilter] = useState<City | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [cargoTypeFilter, setCargoTypeFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(emptyActiveFilters);
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
      const params: Record<string, any> = { page, limit: LIMIT };
      if (activeFilters.loadingCityId) params.loadingCityId = activeFilters.loadingCityId;
      if (activeFilters.unloadingCityId) params.unloadingCityId = activeFilters.unloadingCityId;
      if (activeFilters.loadingDate) params.loadingDate = activeFilters.loadingDate;
      if (activeFilters.cargoType) params.cargoType = activeFilters.cargoType;
      if (activeFilters.requiredVehicleType) params.requiredVehicleType = activeFilters.requiredVehicleType;
      const res = await cargoPostsService.getAll(params);
      setResult(res.data);
    } catch {
      setError('Failed to load cargo posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveFilters({
      loadingCityId: loadingCityFilter?.id || '',
      unloadingCityId: unloadingCityFilter?.id || '',
      loadingDate: dateFilter,
      cargoType: cargoTypeFilter,
      requiredVehicleType: vehicleTypeFilter,
    });
  };

  const handleClear = () => {
    setLoadingCityFilter(null);
    setUnloadingCityFilter(null);
    setDateFilter('');
    setCargoTypeFilter('');
    setVehicleTypeFilter('');
    setPage(1);
    setActiveFilters(emptyActiveFilters);
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
              <label>Loading City</label>
              <CityAutocomplete
                value={loadingCityFilter}
                onChange={setLoadingCityFilter}
                placeholder="e.g. Sarajevo"
              />
            </div>
            <div className="form-group">
              <label>Unloading City</label>
              <CityAutocomplete
                value={unloadingCityFilter}
                onChange={setUnloadingCityFilter}
                placeholder="e.g. Zagreb"
              />
            </div>
            <div className="form-group">
              <label>Loading Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Cargo Type</label>
              <input
                value={cargoTypeFilter}
                onChange={(e) => setCargoTypeFilter(e.target.value)}
                placeholder="e.g. general"
              />
            </div>
            <div className="form-group">
              <label>Vehicle Type</label>
              <input
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
                placeholder="e.g. truck"
              />
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
                    <td>{cityLabel(post, 'loading')}</td>
                    <td>{cityLabel(post, 'unloading')}</td>
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
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                ← Previous
              </button>
              <span className="pagination-info">
                Page {result.page} of {result.totalPages} &nbsp;·&nbsp; {result.total} results
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= result.totalPages}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
