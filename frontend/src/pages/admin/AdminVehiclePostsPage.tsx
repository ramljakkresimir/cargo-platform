import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { VehiclePost, PaginatedResult } from '../../types';
import { extractErrorMessage } from '../../utils/errorUtils';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { vehicleTypeLabel } from '../../constants/postTypes';

const LIMIT = 20;
const STATUSES = [
  { value: '', label: '— Svi —' },
  { value: 'active', label: 'Aktivno' },
  { value: 'closed', label: 'Zatvoreno' },
  { value: 'expired', label: 'Isteklo' },
];

export default function AdminVehiclePostsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedResult<VehiclePost> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearch, activeStatus, page]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = { page, limit: LIMIT };
      if (activeSearch) params.search = activeSearch;
      if (activeStatus) params.status = activeStatus;
      const res = await adminService.getVehiclePosts(params);
      setResult(res.data);
    } catch {
      setError('Učitavanje oglasa vozila nije uspjelo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(search);
    setActiveStatus(statusFilter);
  };

  const handleClear = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
    setActiveSearch('');
    setActiveStatus('');
  };

  const handleStatusChange = async (post: VehiclePost, newStatus: string) => {
    setActionError('');
    setActionSuccess('');
    try {
      await adminService.updateVehiclePostStatus(post.id, newStatus);
      setActionSuccess('Status oglasa je ažuriran.');
      fetchPosts();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Promjena statusa nije uspjela.'));
    }
  };

  const handleDelete = async (post: VehiclePost) => {
    if (!window.confirm(`Obrisati oglas vozila iz ${post.availableLocation}?`)) return;
    setActionError('');
    setActionSuccess('');
    try {
      await adminService.deleteVehiclePost(post.id);
      setActionSuccess('Oglas vozila je obrisan.');
      fetchPosts();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Brisanje oglasa nije uspjelo.'));
    }
  };

  const posts = result?.data ?? [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Oglasi vozila</h1>
      </div>

      <div className="filter-card">
        <form onSubmit={handleSearch}>
          <div className="filter-grid">
            <div className="form-group">
              <label>Pretraga</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Lokacija ili naziv tvrtke"
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
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

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Učitavanje oglasa...</div>}

      {!loading && posts.length === 0 && (
        <EmptyState message="Nema pronađenih oglasa vozila." />
      )}

      {!loading && posts.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lokacija</th>
                  <th>Vrsta vozila</th>
                  <th>Dostupno od</th>
                  <th>Tvrtka</th>
                  <th>Status</th>
                  <th>Objavljeno</th>
                  <th>Radnje</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link to={`/vehicles/${post.id}`} className="table-link">
                        {post.availableLocation}
                      </Link>
                    </td>
                    <td>{vehicleTypeLabel(post.vehicleType)}</td>
                    <td>{post.availableFromDate}</td>
                    <td>{post.company?.companyName || '—'}</td>
                    <td>
                      <StatusBadge status={post.status} />
                    </td>
                    <td>{new Date(post.createdAt).toLocaleDateString('hr-HR')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <select
                          value={post.status}
                          style={{ padding: '5px 8px', fontSize: 13, borderRadius: 6, border: '1px solid var(--color-border-strong)' }}
                          onChange={(e) => handleStatusChange(post, e.target.value)}
                        >
                          <option value="active">Aktivno</option>
                          <option value="closed">Zatvoreno</option>
                          <option value="expired">Isteklo</option>
                        </select>
                        <button
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: 13 }}
                          onClick={() => handleDelete(post)}
                        >
                          Obriši
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result && result.totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                ← Prethodna
              </button>
              <span className="pagination-info">
                Stranica {result.page} od {result.totalPages} &nbsp;·&nbsp; {result.total} oglasa
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
