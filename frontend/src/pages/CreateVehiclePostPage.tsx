import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { extractErrorMessage } from '../utils/errorUtils';

const VEHICLE_TYPES = ['truck', 'van', 'semi_truck', 'refrigerated_truck', 'flatbed', 'tanker'];

export default function CreateVehiclePostPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    availableLocation: '',
    availableFromDate: '',
    vehicleType: '',
    capacity: '',
    destinationPreference: '',
    note: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        availableLocation: form.availableLocation,
        availableFromDate: form.availableFromDate,
        vehicleType: form.vehicleType,
      };
      if (form.capacity) payload.capacity = parseFloat(form.capacity);
      if (form.destinationPreference) payload.destinationPreference = form.destinationPreference;
      if (form.note) payload.note = form.note;

      await vehiclePostsService.create(payload);
      navigate('/vehicles');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to create vehicle post.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Post Available Vehicle</h1>
        <p>Publish your vehicle capacity to find freight</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Current Location *</label>
              <input
                name="availableLocation"
                value={form.availableLocation}
                onChange={handleChange}
                placeholder="e.g. Mostar, BiH"
                required
              />
            </div>
            <div className="form-group">
              <label>Available From *</label>
              <input
                type="date"
                name="availableFromDate"
                value={form.availableFromDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Type *</label>
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange} required>
                <option value="">-- Select vehicle type --</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Capacity (tonnes)</label>
              <input
                type="number"
                step="0.1"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                placeholder="e.g. 20"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Destination Preference</label>
            <input
              name="destinationPreference"
              value={form.destinationPreference}
              onChange={handleChange}
              placeholder="e.g. Croatia, Slovenia, Germany"
            />
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Special equipment, restrictions, contact info..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/vehicles')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Vehicle Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
