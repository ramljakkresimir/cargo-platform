import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { VehiclePost } from '../types';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/errorUtils';

const VEHICLE_TYPES = ['truck', 'van', 'semi_truck', 'refrigerated_truck', 'flatbed', 'tanker'];
const STATUSES = ['active', 'closed'];

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [post, setPost] = useState<VehiclePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    availableLocation: '',
    availableFromDate: '',
    vehicleType: '',
    capacity: '',
    destinationPreference: '',
    note: '',
    status: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

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
      const res = await vehiclePostsService.getOne(postId);
      setPost(res.data);
    } catch {
      setError('Vehicle post not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this vehicle post?')) return;
    try {
      await vehiclePostsService.remove(id);
      navigate('/vehicles');
    } catch {
      setError('Failed to delete post.');
    }
  };

  const startEditing = () => {
    if (!post) return;
    setEditForm({
      availableLocation: post.availableLocation,
      availableFromDate: post.availableFromDate,
      vehicleType: post.vehicleType,
      capacity: post.capacity != null ? String(post.capacity) : '',
      destinationPreference: post.destinationPreference || '',
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
        availableLocation: editForm.availableLocation,
        availableFromDate: editForm.availableFromDate,
        vehicleType: editForm.vehicleType,
        status: editForm.status,
      };
      if (editForm.capacity) payload.capacity = parseFloat(editForm.capacity);
      if (editForm.destinationPreference) payload.destinationPreference = editForm.destinationPreference;
      if (editForm.note) payload.note = editForm.note;

      const res = await vehiclePostsService.update(id, payload);
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
          <Link to="/vehicles" className="back-link">← Back to Vehicles</Link>
          <h1>{post.vehicleType} — {post.availableLocation}</h1>
          <span className={`status-badge status-${post.status}`}>{post.status}</span>
        </div>
        {isOwner && !isEditing && (
          <div className="action-buttons">
            <button className="btn-secondary" onClick={startEditing}>Edit Post</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        )}
      </div>

      {saveSuccess && <div className="alert alert-success">{saveSuccess}</div>}

      {isEditing ? (
        <div className="form-card">
          <h2>Edit Vehicle Post</h2>
          {saveError && <div className="alert alert-error">{saveError}</div>}
          <form onSubmit={handleEditSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Current Location *</label>
                <input
                  name="availableLocation"
                  value={editForm.availableLocation}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Available From *</label>
                <input
                  type="date"
                  name="availableFromDate"
                  value={editForm.availableFromDate}
                  onChange={handleEditChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Vehicle Type *</label>
                <select name="vehicleType" value={editForm.vehicleType} onChange={handleEditChange} required>
                  <option value="">-- Select vehicle type --</option>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Capacity (tonnes)</label>
                <input
                  type="number"
                  step="0.1"
                  name="capacity"
                  value={editForm.capacity}
                  onChange={handleEditChange}
                  placeholder="e.g. 20"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Destination Preference</label>
                <input
                  name="destinationPreference"
                  value={editForm.destinationPreference}
                  onChange={handleEditChange}
                  placeholder="e.g. Croatia, Slovenia, Germany"
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
            <h2>Vehicle Information</h2>
            <div className="detail-grid">
              <div><span className="label">Vehicle Type</span><p>{post.vehicleType}</p></div>
              <div><span className="label">Available Location</span><p>{post.availableLocation}</p></div>
              <div><span className="label">Available From</span><p>{post.availableFromDate}</p></div>
              <div><span className="label">Capacity</span><p>{post.capacity ? `${post.capacity} t` : '—'}</p></div>
              <div><span className="label">Destination Preference</span><p>{post.destinationPreference || '—'}</p></div>
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
