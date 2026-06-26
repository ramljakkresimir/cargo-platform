import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { VehiclePost, PaginatedResult, City } from '../types';
import { useAuth } from '../context/AuthContext';
import CityAutocomplete from '../components/CityAutocomplete';

const LIMIT = 10;

interface ActiveFilters {
  originCityId: string;
  destinationCityId: string;
  availableFromDate: string;
  vehicleType: string;
}

const emptyActiveFilters: ActiveFilters = {
  originCityId: '',
  destinationCityId: '',
  availableFromDate: '',
  vehicleType: '',
};

function originLabel(post: VehiclePost): string {
  return post.originCity?.name || post.availableLocation || '—';
}

function destLabel(post: VehiclePost): string {
  return post.destinationCity?.name || post.destinationPreference || '—';
}

export default function VehicleListPage() {
  const { token } = useAuth();

  const [originCityFilter, setOriginCityFilter] = useState<City | null>(null);
  const [destCityFilter, setDestCityFilter] = useState<City | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(emptyActiveFilters);
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
      const params: Record<string, any> = { page, limit: LIMIT };
      if (activeFilters.originCityId) params.originCityId = activeFilters.originCityId;
      if (activeFilters.destinationCityId) params.destinationCityId = activeFilters.destinationCityId;
      if (activeFilters.availableFromDate) params.availableFromDate = activeFilters.availableFromDate;
      if (activeFilters.vehicleType) params.vehicleType = activeFilters.vehicleType;
      const res = await vehiclePostsService.getAll(params);
      setResult(res.data);
    } catch {
      setError('Failed to load vehicle posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveFilters({
      originCityId: originCityFilter?.id || '',
      destinationCityId: destCityFilter?.id || '',
      availableFromDate: dateFilter,
      vehicleType: vehicleTypeFilter,
    });
  };

  const handleClear = () => {
    setOriginCityFilter(null);
    setDestCityFilter(null);
    setDateFilter('');
    setVehicleTypeFilter('');
    setPage(1);
    setActiveFilters(emptyActiveFilters);
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
              <label>Origin City</label>
              <CityAutocomplete
                value={originCityFilter}
                onChange={setOriginCityFilter}
                placeholder="e.g. Banja Luka"
              />
            </div>
            <div className="form-group">
              <label>Destination City</label>
              <CityAutocomplete
                value={destCityFilter}
                onChange={setDestCityFilter}
                placeholder="e.g. Split"
              />
            </div>
            <div className="form-group">
              <label>Available From</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
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
                    <td>{originLabel(post)}</td>
                    <td>{post.availableFromDate}</td>
                    <td>{post.vehicleType}</td>
                    <td>{post.capacity || '—'}</td>
                    <td>{destLabel(post)}</td>
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
