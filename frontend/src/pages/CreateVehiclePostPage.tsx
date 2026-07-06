import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { extractErrorMessage } from '../utils/errorUtils';
import { City } from '../types';
import CityAutocomplete from '../components/CityAutocomplete';

const VEHICLE_TYPES = ['truck', 'van', 'semi_truck', 'refrigerated_truck', 'flatbed', 'tanker'];

export default function CreateVehiclePostPage() {
  const navigate = useNavigate();

  const [originCity, setOriginCity] = useState<City | null>(null);
  const [destinationCity, setDestinationCity] = useState<City | null>(null);
  const [form, setForm] = useState({
    availableFromDate: '',
    vehicleType: '',
    capacity: '',
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
    if (!originCity) { setError('Please select a current location city.'); return; }
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (form.availableFromDate < todayStr) { setError('Available from date cannot be in the past.'); return; }
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        originCityId: originCity.id,
        availableFromDate: form.availableFromDate,
        vehicleType: form.vehicleType,
      };
      if (destinationCity) payload.destinationCityId = destinationCity.id;
      if (form.capacity) payload.capacity = parseFloat(form.capacity);
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
              <CityAutocomplete
                value={originCity}
                onChange={setOriginCity}
                placeholder="e.g. Mostar"
                required={false}
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
                value={form.capacity}
                onChange={handleChange}
                placeholder="e.g. 20"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Destination Preference</label>
            <CityAutocomplete
              value={destinationCity}
              onChange={setDestinationCity}
              placeholder="e.g. Zagreb, Split…"
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
