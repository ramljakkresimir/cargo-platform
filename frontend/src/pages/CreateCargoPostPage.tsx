import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cargoPostsService } from '../services/cargoPosts.service';
import { extractErrorMessage } from '../utils/errorUtils';
import { City } from '../types';
import CityAutocomplete from '../components/CityAutocomplete';
import { CARGO_TYPES, VEHICLE_TYPES } from '../constants/postTypes';

export default function CreateCargoPostPage() {
  const navigate = useNavigate();

  const [loadingCity, setLoadingCity] = useState<City | null>(null);
  const [unloadingCity, setUnloadingCity] = useState<City | null>(null);
  const [form, setForm] = useState({
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
    if (!loadingCity) { setError('Odaberite mjesto utovara.'); return; }
    if (!unloadingCity) { setError('Odaberite mjesto istovara.'); return; }
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (form.loadingDate < todayStr) { setError('Datum utovara ne može biti u prošlosti.'); return; }
    setError('');
    setLoading(true);

    try {
      const payload: Parameters<typeof cargoPostsService.create>[0] = {
        loadingCityId: loadingCity.id,
        unloadingCityId: unloadingCity.id,
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
    } catch (err) {
      setError(extractErrorMessage(err, 'Objavljivanje oglasa nije uspjelo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container-form">
      <div className="page-header">
        <div>
          <h1>Objavi teret</h1>
          <p className="page-subtitle">Objavite teret za koji tražite prijevoz — traje samo minutu.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Ruta</div>
          <div className="form-row">
            <div className="form-group">
              <label>Mjesto utovara *</label>
              <CityAutocomplete
                value={loadingCity}
                onChange={setLoadingCity}
                placeholder="npr. Sarajevo"
                required={false}
              />
            </div>
            <div className="form-group">
              <label>Mjesto istovara *</label>
              <CityAutocomplete
                value={unloadingCity}
                onChange={setUnloadingCity}
                placeholder="npr. Zagreb"
                required={false}
              />
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label>Datum utovara *</label>
            <input
              type="date"
              name="loadingDate"
              value={form.loadingDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-section-title">Detalji tereta</div>
          <div className="form-row">
            <div className="form-group">
              <label>Vrsta tereta</label>
              <select name="cargoType" value={form.cargoType} onChange={handleChange}>
                <option value="">-- Odaberite vrstu --</option>
                {CARGO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Potrebno vozilo</label>
              <select name="requiredVehicleType" value={form.requiredVehicleType} onChange={handleChange}>
                <option value="">-- Bilo koje vozilo --</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Težina (tone)</label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                placeholder="npr. 5.5"
              />
            </div>
            <div className="form-group">
              <label>Dimenzije (DxŠxV)</label>
              <input
                name="dimensions"
                value={form.dimensions}
                onChange={handleChange}
                placeholder="npr. 3x2x2m"
              />
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label>Cijena (EUR)</label>
            <input
              type="number"
              step="0.01"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="npr. 450"
            />
          </div>

          <div className="form-group">
            <label>Napomene</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Posebni zahtjevi, upute za rukovanje, kontakt..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/cargo')}>
              Odustani
            </button>
            <button type="submit" className="btn-primary-teal" disabled={loading}>
              {loading ? 'Objavljivanje...' : 'Objavi teret'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
