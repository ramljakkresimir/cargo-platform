import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { cargoPostsService } from '../services/cargoPosts.service';
import { CargoPost } from '../types';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/errorUtils';

const CARGO_TYPES = ['general', 'palletized', 'bulk', 'liquid', 'refrigerated', 'hazardous', 'oversized'];
const VEHICLE_TYPES = ['truck', 'van', 'semi_truck', 'refrigerated_truck', 'flatbed', 'tanker'];
const STATUSES = ['active', 'closed'];

export default function CargoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [post, setPost] = useState<CargoPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    loadingLocation: '',
    unloadingLocation: '',
    loadingDate: '',
    cargoType: '',
    weight: '',
    dimensions: '',
    requiredVehicleType: '',
    price: '',
    note: '',
    status: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);

  useEffect(() => {
    if (id) fetchPost(id);
  }, [id]);

  // Auto-open edit form when navigated from My Posts page
  useEffect(() => {
    if (post && location.state?.startEditing) {
      startEditing();
    }
  }, [post]);

  const fetchPost = async (postId: string) => {
    try {
      const res = await cargoPostsService.getOne(postId);
      setPost(res.data);
    } catch {
      setError('Cargo post not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this cargo post?')) return;
    try {
      await cargoPostsService.remove(id);
      navigate('/cargo');
    } catch {
      setError('Failed to delete post.');
    }
  };

  const handleClose = async () => {
    if (!id || !confirm('Close this cargo post? It will no longer appear in public listings.')) return;
    setCloseLoading(true);
    setSaveSuccess('');
    setSaveError('');
    try {
      const res = await cargoPostsService.update(id, { status: 'closed' });
      setPost(res.data);
      setSaveSuccess('Post closed successfully.');
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'Failed to close post.'));
    } finally {
      setCloseLoading(false);
    }
  };

  const startEditing = () => {
    if (!post) return;
    setEditForm({
      loadingLocation: post.loadingLocation,
      unloadingLocation: post.unloadingLocation,
      loadingDate: post.loadingDate,
      cargoType: post.cargoType || '',
      weight: post.weight != null ? String(post.weight) : '',
      dimensions: post.dimensions || '',
      requiredVehicleType: post.requiredVehicleType || '',
      price: post.price != null ? String(post.price) : '',
      note: post.note || '',
      status: post.status,
    });
    setSaveError('');
    setSaveSuccess('');
    setIsEditing(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaveError('');
    setSaveSuccess('');
    setSaveLoading(true);

    try {
      const payload: Record<string, any> = {
        loadingLocation: editForm.loadingLocation,
        unloadingLocation: editForm.unloadingLocation,
        loadingDate: editForm.loadingDate,
        status: editForm.status,
      };
      if (editForm.cargoType) payload.cargoType = editForm.cargoType;
      if (editForm.weight) payload.weight = parseFloat(editForm.weight);
      if (editForm.dimensions) payload.dimensions = editForm.dimensions;
      if (editForm.requiredVehicleType) payload.requiredVehicleType = editForm.requiredVehicleType;
      if (editForm.price) payload.price = parseFloat(editForm.price);
      if (editForm.note) payload.note = editForm.note;

      const res = await cargoPostsService.update(id, payload);
      setPost(res.data);
      setIsEditing(false);
      setSaveSuccess('Post updated successfully.');
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'Failed to update post.'));
    } finally {
      setSaveLoading(false);
    }
  };

  const isOwner = user && post?.company?.userId === user.id;

  if (loading) return <div className="page-container"><p>Loading...</p></div>;
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>;
  if (!post) return null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/cargo" className="back-link">← Back to Cargo</Link>
          <h1>{post.loadingLocation} → {post.unloadingLocation}</h1>
          <span className={`status-badge status-${post.status}`}>{post.status}</span>
        </div>
        {isOwner && !isEditing && (
          <div className="action-buttons">
            {post.status === 'active' && (
              <button className="btn-secondary" onClick={handleClose} disabled={closeLoading}>
                {closeLoading ? 'Closing...' : 'Close Post'}
              </button>
            )}
            <button className="btn-secondary" onClick={startEditing}>Edit Post</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        )}
      </div>

      {saveSuccess && <div className="alert alert-success">{saveSuccess}</div>}

      {isEditing ? (
        <div className="form-card">
          <h2>Edit Cargo Post</h2>
          {saveError && <div className="alert alert-error">{saveError}</div>}
          <form onSubmit={handleEditSubmit}>
            <h2>Route Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Loading Location *</label>
                <input
                  name="loadingLocation"
                  value={editForm.loadingLocation}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Unloading Location *</label>
                <input
                  name="unloadingLocation"
                  value={editForm.unloadingLocation}
                  onChange={handleEditChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ maxWidth: '200px' }}>
                <label>Loading Date *</label>
                <input
                  type="date"
                  name="loadingDate"
                  value={editForm.loadingDate}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group" style={{ maxWidth: '160px' }}>
                <label>Status</label>
                <select name="status" value={editForm.status} onChange={handleEditChange}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <h2>Cargo Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Cargo Type</label>
                <select name="cargoType" value={editForm.cargoType} onChange={handleEditChange}>
                  <option value="">-- Select type --</option>
                  {CARGO_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Required Vehicle Type</label>
                <select name="requiredVehicleType" value={editForm.requiredVehicleType} onChange={handleEditChange}>
                  <option value="">-- Any vehicle --</option>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Weight (tonnes)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={editForm.weight}
                  onChange={handleEditChange}
                  placeholder="e.g. 5.5"
                />
              </div>
              <div className="form-group">
                <label>Dimensions (LxWxH)</label>
                <input
                  name="dimensions"
                  value={editForm.dimensions}
                  onChange={handleEditChange}
                  placeholder="e.g. 3x2x2m"
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label>Price (EUR)</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={editForm.price}
                onChange={handleEditChange}
                placeholder="e.g. 450"
              />
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                name="note"
                value={editForm.note}
                onChange={handleEditChange}
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="detail-layout">
          <div className="detail-card">
            <h2>Cargo Information</h2>
            <div className="detail-grid">
              <div><span className="label">Loading Location</span><p>{post.loadingLocation}</p></div>
              <div><span className="label">Unloading Location</span><p>{post.unloadingLocation}</p></div>
              <div><span className="label">Loading Date</span><p>{post.loadingDate}</p></div>
              <div><span className="label">Cargo Type</span><p>{post.cargoType || '—'}</p></div>
              <div><span className="label">Weight</span><p>{post.weight ? `${post.weight} t` : '—'}</p></div>
              <div><span className="label">Dimensions</span><p>{post.dimensions || '—'}</p></div>
              <div><span className="label">Required Vehicle</span><p>{post.requiredVehicleType || '—'}</p></div>
              <div><span className="label">Price</span><p>{post.price ? `€${post.price}` : 'Negotiable'}</p></div>
            </div>
            {post.note && (
              <div className="detail-note">
                <span className="label">Notes</span>
                <p>{post.note}</p>
              </div>
            )}
          </div>

          {post.company && (
            <div className="detail-card">
              <h2>Contact / Company</h2>
              <div className="detail-grid">
                <div><span className="label">Company</span><p>{post.company.companyName}</p></div>
                <div><span className="label">Type</span><p>{post.company.companyType}</p></div>
                <div><span className="label">Location</span><p>{post.company.city}, {post.company.country}</p></div>
                {post.company.phone && <div><span className="label">Phone</span><p>{post.company.phone}</p></div>}
                {post.company.email && <div><span className="label">Email</span><p>{post.company.email}</p></div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
