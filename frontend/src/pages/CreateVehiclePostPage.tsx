import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { extractErrorMessage } from '../utils/errorUtils';
import { City } from '../types';
import CityAutocomplete from '../components/CityAutocomplete';
import { VEHICLE_TYPES } from '../constants/postTypes';

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
    if (!originCity) { setError('Odaberite trenutnu lokaciju.'); return; }
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (form.availableFromDate < todayStr) { setError('Datum dostupnosti ne može biti u prošlosti.'); return; }
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
      setError(extractErrorMessage(err, 'Objavljivanje oglasa nije uspjelo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container-form">
      <div className="page-header">
        <div>
          <h1>Objavi slobodno vozilo</h1>
          <p className="page-subtitle">Objavite rutu i slobodan kapacitet vozila kako biste pronašli teret.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Trenutna lokacija *</label>
              <CityAutocomplete
                value={originCity}
                onChange={setOriginCity}
                placeholder="npr. Mostar"
                required={false}
              />
            </div>
            <div className="form-group">
              <label>Dostupno od *</label>
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
              <label>Vrsta vozila *</label>
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange} required>
                <option value="">-- Odaberite vrstu vozila --</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Kapacitet (tone)</label>
              <input
                type="number"
                step="0.1"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                placeholder="npr. 20"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Željeno odredište</label>
            <CityAutocomplete
              value={destinationCity}
              onChange={setDestinationCity}
              placeholder="npr. Zagreb, Split…"
            />
          </div>

          <div className="form-group">
            <label>Napomene</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Posebna oprema, ograničenja, kontakt..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/vehicles')}>
              Odustani
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Objavljivanje...' : 'Objavi vozilo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
