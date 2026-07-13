import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { cargoPostsService } from '../services/cargoPosts.service';
import { CargoPost, PaginatedResult, City } from '../types';
import CityAutocomplete from '../components/CityAutocomplete';
import EmptyState from '../components/EmptyState';
import { PackageIcon } from '../components/Icons';
import { CARGO_TYPES, VEHICLE_TYPES, cargoTypeLabel, vehicleTypeLabel } from '../constants/postTypes';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError('Nije moguće učitati oglase tereta.');
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
        <div>
          <h1>Dostupni tereti</h1>
          <p className="page-subtitle">
            {result ? `${result.total} ${result.total === 1 ? 'oglas' : 'oglasa'} pronađeno` : 'Pregledajte objavljene terete'}
          </p>
        </div>
        <Link to="/cargo/new" className="btn-primary-teal">+ Objavi teret</Link>
      </div>

      <div className="filter-card">
        <form onSubmit={handleSearch}>
          <div className="filter-grid">
            <div className="form-group">
              <label>Mjesto utovara</label>
              <CityAutocomplete
                value={loadingCityFilter}
                onChange={setLoadingCityFilter}
                placeholder="npr. Sarajevo"
              />
            </div>
            <div className="form-group">
              <label>Mjesto istovara</label>
              <CityAutocomplete
                value={unloadingCityFilter}
                onChange={setUnloadingCityFilter}
                placeholder="npr. Zagreb"
              />
            </div>
            <div className="form-group">
              <label>Datum utovara</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Vrsta tereta</label>
              <select value={cargoTypeFilter} onChange={(e) => setCargoTypeFilter(e.target.value)}>
                <option value="">Sve vrste</option>
                {CARGO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
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
            <button type="submit" className="btn-primary-teal">Pretraži</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>Poništi filtre</button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Učitavanje...</div>}

      {!loading && posts.length === 0 && (
        <EmptyState message="Nema tereta koji odgovara odabranim filtrima. Pokušajte proširiti pretragu." />
      )}

      {!loading && posts.length > 0 && (
        <>
          <div className="result-list">
            {posts.map((post) => (
              <div className="result-card" key={post.id}>
                <div className="result-card-left">
                  <span className="result-card-icon teal"><PackageIcon size={20} /></span>
                  <div>
                    <div className="result-card-route">
                      {cityLabel(post, 'loading')} <span className="arrow">→</span> {cityLabel(post, 'unloading')}
                    </div>
                    <div className="result-card-subline">
                      Utovar {post.loadingDate} · {post.company?.companyName || '—'}
                    </div>
                  </div>
                </div>
                <div className="result-card-right">
                  <span className="chip">{cargoTypeLabel(post.cargoType)}</span>
                  {post.requiredVehicleType && (
                    <span className="result-card-meta-text">{vehicleTypeLabel(post.requiredVehicleType)}</span>
                  )}
                  <span className="result-card-meta-text">{post.weight ? `${post.weight} t` : '—'}</span>
                  <span className="result-card-price">{post.price ? `€${post.price}` : 'Po dogovoru'}</span>
                  <Link to={`/cargo/${post.id}`} className="btn-secondary">Pregled</Link>
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
