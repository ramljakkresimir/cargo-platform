import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cargoPostsService } from '../services/cargoPosts.service';

const CARGO_TYPES = ['general', 'palletized', 'bulk', 'liquid', 'refrigerated', 'hazardous', 'oversized'];
const VEHICLE_TYPES = ['truck', 'van', 'semi_truck', 'refrigerated_truck', 'flatbed', 'tanker'];

export default function CreateCargoPostPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    loadingLocation: '',
    unloadingLocation: '',
    loadingDate: '',
    cargoType: '',
    weight: '',
    dimensions: '',
    requiredVehicleType: '',
    price: '',
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
        loadingLocation: form.loadingLocation,
        unloadingLocation: form.unloadingLocation,
        loadingDate: form.loadingDate,
      };
      if (form.cargoType) payload.cargoType = form.cargoType;
      if (form.weight) payload.weight = parseFloat(form.weight);
      if (form.dimensions) payload.dimensions = form.dimensions;
      if (form.requiredVehicleType) payload.requiredVehicleType = form.requiredVehicleType;
      if (form.price) payload.price = parseFloat(form.price);
      if (form.note) payload.note = form.note;

      await cargoPostsService.create(payload);
      navigate('/cargo');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create cargo post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Post Cargo</h1>
        <p>Publish your cargo to find transport companies</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <h2>Route Details</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Loading Location *</label>
              <input
                name="loadingLocation"
                value={form.loadingLocation}
                onChange={handleChange}
                placeholder="e.g. Sarajevo, BiH"
                required
              />
            </div>
            <div className="form-group">
              <label>Unloading Location *</label>
              <input
                name="unloadingLocation"
                value={form.unloadingLocation}
                onChange={handleChange}
                placeholder="e.g. Zagreb, Croatia"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label>Loading Date *</label>
            <input
              type="date"
              name="loadingDate"
              value={form.loadingDate}
              onChange={handleChange}
              required
            />
          </div>

          <h2>Cargo Details</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Cargo Type</label>
              <select name="cargoType" value={form.cargoType} onChange={handleChange}>
                <option value="">-- Select type --</option>
                {CARGO_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Required Vehicle Type</label>
              <select name="requiredVehicleType" value={form.requiredVehicleType} onChange={handleChange}>
                <option value="">-- Any vehicle --</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
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
                value={form.weight}
                onChange={handleChange}
                placeholder="e.g. 5.5"
              />
            </div>
            <div className="form-group">
              <label>Dimensions (LxWxH)</label>
              <input
                name="dimensions"
                value={form.dimensions}
                onChange={handleChange}
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
              value={form.price}
              onChange={handleChange}
              placeholder="e.g. 450"
            />
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Any special requirements, handling instructions, etc."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/cargo')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Cargo Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
