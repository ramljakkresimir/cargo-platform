import { useState, useEffect, FormEvent } from 'react';
import { adminService } from '../../services/admin.service';
import { PaginatedResult, User } from '../../types';
import { extractErrorMessage } from '../../utils/errorUtils';
import { useAuth } from '../../context/AuthContext';

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
      setError('Failed to load users.');
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
      setActionSuccess(`Role for ${user.email} changed to "${newRole}".`);
      fetchUsers();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to update role.'));
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Delete user ${user.email}? This will also delete their company and all their posts.`)) return;
    setActionError('');
    setActionSuccess('');
    try {
      await adminService.deleteUser(user.id);
      setActionSuccess(`User ${user.email} deleted.`);
      fetchUsers();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to delete user.'));
    }
  };

  const users = result?.data ?? [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Users</h1>
      </div>

      <div className="filter-card">
        <form onSubmit={handleSearch}>
          <div className="filter-grid" style={{ gridTemplateColumns: '1fr auto auto' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Search by name, email, or phone</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. john@example.com"
              />
            </div>
          </div>
          <div className="filter-actions" style={{ marginTop: 12 }}>
            <button type="submit" className="btn-primary">Search</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>Clear</button>
          </div>
        </form>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Loading users...</div>}

      {!loading && users.length === 0 && (
        <div className="empty-state">No users found.</div>
      )}

      {!loading && users.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
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
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt!).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {u.role === 'user' ? (
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 13 }}
                            onClick={() => handleRoleChange(u, 'admin')}
                            disabled={u.id === currentUser?.id}
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 13 }}
                            onClick={() => handleRoleChange(u, 'user')}
                          >
                            Remove Admin
                          </button>
                        )}
                        <button
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: 13 }}
                          onClick={() => handleDelete(u)}
                          disabled={u.id === currentUser?.id}
                        >
                          Delete
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
                ← Previous
              </button>
              <span className="pagination-info">
                Page {result.page} of {result.totalPages} &nbsp;·&nbsp; {result.total} users
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
