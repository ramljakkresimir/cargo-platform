import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { VehiclePost, PaginatedResult, City } from '../types';
import CityAutocomplete from '../components/CityAutocomplete';
import EmptyState from '../components/EmptyState';
import { TruckIcon } from '../components/Icons';
import { VEHICLE_TYPES, vehicleTypeLabel } from '../constants/postTypes';

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
  const [originCityFilter, setOriginCityFilter] = useState<City | null>(null);
  const [destCityFilter, setDestCityFilter] = useState<City | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(emptyActiveFilters);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedResult<VehiclePost> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Flip into the loading state during render (React's recommended pattern for
  // "reset state when an input changes") rather than synchronously inside the
  // effect below, which the fetch itself only enters asynchronously.
  const [prevFilters, setPrevFilters] = useState(activeFilters);
  const [prevPage, setPrevPage] = useState(page);
  if (activeFilters !== prevFilters || page !== prevPage) {
    setPrevFilters(activeFilters);
    setPrevPage(page);
    setLoading(true);
    setError('');
  }

  const fetchPosts = async () => {
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (activeFilters.originCityId) params.originCityId = activeFilters.originCityId;
      if (activeFilters.destinationCityId) params.destinationCityId = activeFilters.destinationCityId;
      if (activeFilters.availableFromDate) params.availableFromDate = activeFilters.availableFromDate;
      if (activeFilters.vehicleType) params.vehicleType = activeFilters.vehicleType;
      const res = await vehiclePostsService.getAll(params);
      setResult(res.data);
    } catch {
      setError('Nije moguće učitati oglase vozila.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Data fetching over the network — the setState calls in fetchPosts's
    // catch/finally are the async result of this effect, not derivable at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters, page]);

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
  const routeAware = Boolean(activeFilters.originCityId && activeFilters.destinationCityId);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Dostupna vozila</h1>
          <p className="page-subtitle">
            {result ? `${result.total} ${result.total === 1 ? 'vozilo' : 'vozila'} dostupno` : 'Pregledajte dostupna vozila'}
          </p>
        </div>
        <Link to="/vehicles/new" className="btn-primary">+ Objavi vozilo</Link>
      </div>

      <div className="filter-card">
        <form onSubmit={handleSearch}>
          <div className="filter-grid">
            <div className="form-group">
              <label>Polazište</label>
              <CityAutocomplete
                value={originCityFilter}
                onChange={setOriginCityFilter}
                placeholder="npr. Banja Luka"
              />
            </div>
            <div className="form-group">
              <label>Odredište</label>
              <CityAutocomplete
                value={destCityFilter}
                onChange={setDestCityFilter}
                placeholder="npr. Split"
              />
            </div>
            <div className="form-group">
              <label>Dostupno od</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Vrsta vozila</label>
              <select value={vehicleTypeFilter} onChange={(e) => setVehicleTypeFilter(e.target.value)}>
                <option value="">Sve vrste</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button type="submit" className="btn-primary">Pretraži</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>Poništi filtre</button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Učitavanje...</div>}

      {!loading && posts.length === 0 && (
        <EmptyState message="Nema vozila koje odgovara odabranim filtrima. Pokušajte proširiti pretragu." />
      )}

      {!loading && posts.length > 0 && (
        <>
          {routeAware && (
            <div className="route-match-banner">
              <strong>Pretraga po ruti</strong> — prikazana su vozila čija ruta prolazi kroz oba odabrana grada, tim redoslijedom.
            </div>
          )}
          <div className="result-list">
            {posts.map((post) => (
              <div className="result-card" key={post.id}>
                <div className="result-card-left">
                  <span className="result-card-icon blue"><TruckIcon size={20} /></span>
                  <div>
                    <div className="result-card-route">
                      {originLabel(post)} <span className="arrow">→</span> {destLabel(post)}
                      {routeAware && <span className="chip-match" style={{ marginLeft: 10 }}>Odgovara traženoj ruti</span>}
                    </div>
                    <div className="result-card-subline">
                      Dostupno od {post.availableFromDate} · {post.company?.companyName || '—'}
                    </div>
                  </div>
                </div>
                <div className="result-card-right">
                  <span className="chip">{vehicleTypeLabel(post.vehicleType)}</span>
                  <span className="result-card-meta-text">{post.capacity ? `${post.capacity} t kapacitet` : '—'}</span>
                  <Link to={`/vehicles/${post.id}`} className="btn-secondary">Pregled</Link>
                </div>
              </div>
            ))}
          </div>

          {result && result.totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                ← Prethodna
              </button>
              <span className="pagination-info">
                Stranica {result.page} od {result.totalPages} &nbsp;·&nbsp; {result.total} rezultata
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= result.totalPages}>
                Sljedeća →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
