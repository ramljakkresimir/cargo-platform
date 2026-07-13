import { useState, useEffect, FormEvent } from 'react';
import { adminService } from '../../services/admin.service';
import { PaginatedResult, User } from '../../types';
import { extractErrorMessage } from '../../utils/errorUtils';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';

const LIMIT = 20;

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedResult<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearch, page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = { page, limit: LIMIT };
      if (activeSearch) params.search = activeSearch;
      const res = await adminService.getUsers(params);
      setResult(res.data);
    } catch {
      setError('Učitavanje korisnika nije uspjelo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(search);
  };

  const handleClear = () => {
    setSearch('');
    setPage(1);
    setActiveSearch('');
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    setActionError('');
    setActionSuccess('');
    try {
      await adminService.updateUserRole(user.id, newRole);
      setActionSuccess(`Uloga korisnika ${user.email} promijenjena je u "${newRole === 'admin' ? 'administrator' : 'korisnik'}".`);
      fetchUsers();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Promjena uloge nije uspjela.'));
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Obrisati korisnika ${user.email}? Ovo će obrisati i njegovu tvrtku te sve njegove oglase.`)) return;
    setActionError('');
    setActionSuccess('');
    try {
      await adminService.deleteUser(user.id);
      setActionSuccess(`Korisnik ${user.email} je obrisan.`);
      fetchUsers();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Brisanje korisnika nije uspjelo.'));
    }
  };

  const users = result?.data ?? [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Korisnici</h1>
      </div>

      <div className="filter-card">
        <form onSubmit={handleSearch}>
          <div className="filter-grid" style={{ gridTemplateColumns: '1fr auto auto' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Pretraga po imenu, e-mailu ili telefonu</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="npr. ivan@example.com"
              />
            </div>
          </div>
          <div className="filter-actions" style={{ marginTop: 12 }}>
            <button type="submit" className="btn-primary">Pretraži</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>Poništi filtre</button>
          </div>
        </form>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Učitavanje korisnika...</div>}

      {!loading && users.length === 0 && (
        <EmptyState message="Nema pronađenih korisnika." />
      )}

      {!loading && users.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ime</th>
                  <th>E-mail</th>
                  <th>Telefon</th>
                  <th>Uloga</th>
                  <th>Registriran</th>
                  <th>Radnje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span
                        className={`status-badge ${u.role === 'admin' ? 'status-active' : 'status-closed'}`}
                      >
                        {u.role === 'admin' ? 'Administrator' : 'Korisnik'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt!).toLocaleDateString('hr-HR')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {u.role === 'user' ? (
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 13 }}
                            onClick={() => handleRoleChange(u, 'admin')}
                            disabled={u.id === currentUser?.id}
                          >
                            Postavi za admina
                          </button>
                        ) : (
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 13 }}
                            onClick={() => handleRoleChange(u, 'user')}
                          >
                            Ukloni admin ulogu
                          </button>
                        )}
                        <button
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: 13 }}
                          onClick={() => handleDelete(u)}
                          disabled={u.id === currentUser?.id}
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
                Stranica {result.page} od {result.totalPages} &nbsp;·&nbsp; {result.total} korisnika
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
