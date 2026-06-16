import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { VehiclePost, PaginatedResult } from '../../types';
import { extractErrorMessage } from '../../utils/errorUtils';

const LIMIT = 20;
const STATUSES = ['', 'active', 'closed', 'expired'];

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
      setError('Failed to load vehicle posts.');
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
      setActionSuccess(`Post status updated to "${newStatus}".`);
      fetchPosts();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to update status.'));
    }
  };

  const handleDelete = async (post: VehiclePost) => {
    if (!window.confirm(`Delete vehicle post from ${post.availableLocation}?`)) return;
    setActionError('');
    setActionSuccess('');
    try {
      await adminService.deleteVehiclePost(post.id);
      setActionSuccess('Vehicle post deleted.');
      fetchPosts();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to delete post.'));
    }
  };

  const posts = result?.data ?? [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Vehicle Posts</h1>
      </div>

      <div className="filter-card">
        <form onSubmit={handleSearch}>
          <div className="filter-grid">
            <div className="form-group">
              <label>Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Location or company name"
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s || '— All —'}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button type="submit" className="btn-primary">Search</button>
            <button type="button" className="btn-secondary" onClick={handleClear}>Clear</button>
          </div>
        </form>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Loading posts...</div>}

      {!loading && posts.length === 0 && (
        <div className="empty-state">No vehicle posts found.</div>
      )}

      {!loading && posts.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Vehicle Type</th>
                  <th>Available From</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
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
                    <td>{post.vehicleType}</td>
                    <td>{post.availableFromDate}</td>
                    <td>{post.company?.companyName || '—'}</td>
                    <td>
                      <span className={`status-badge status-${post.status}`}>{post.status}</span>
                    </td>
                    <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <select
                          value={post.status}
                          style={{ padding: '3px 6px', fontSize: 13, borderRadius: 4, border: '1px solid #d1d5db' }}
                          onChange={(e) => handleStatusChange(post, e.target.value)}
                        >
                          <option value="active">active</option>
                          <option value="closed">closed</option>
                          <option value="expired">expired</option>
                        </select>
                        <button
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: 13 }}
                          onClick={() => handleDelete(post)}
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
                Page {result.page} of {result.totalPages} &nbsp;·&nbsp; {result.total} posts
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
