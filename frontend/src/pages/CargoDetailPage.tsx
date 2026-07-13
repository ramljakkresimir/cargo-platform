import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { cargoPostsService } from '../services/cargoPosts.service';
import { CargoPost, City } from '../types';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/errorUtils';
import CityAutocomplete from '../components/CityAutocomplete';
import StatusBadge from '../components/StatusBadge';
import { CARGO_TYPES, VEHICLE_TYPES } from '../constants/postTypes';

const STATUSES = [
  { value: 'active', label: 'Aktivno' },
  { value: 'closed', label: 'Zatvoreno' },
];

function locationLabel(post: CargoPost, type: 'loading' | 'unloading'): string {
  if (type === 'loading') {
    return post.loadingCity?.name
      ? `${post.loadingCity.name}, ${post.loadingCity.country}`
      : (post.loadingLocation || '—');
  }
  return post.unloadingCity?.name
    ? `${post.unloadingCity.name}, ${post.unloadingCity.country}`
    : (post.unloadingLocation || '—');
}

export default function CargoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [post, setPost] = useState<CargoPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editLoadingCity, setEditLoadingCity] = useState<City | null>(null);
  const [editUnloadingCity, setEditUnloadingCity] = useState<City | null>(null);
  const [editForm, setEditForm] = useState({
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

  useEffect(() => {
    if (post && location.state?.startEditing) {
      startEditing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

  const fetchPost = async (postId: string) => {
    try {
      const res = await cargoPostsService.getOne(postId);
      setPost(res.data);
    } catch {
      setError('Oglas tereta nije pronađen.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Obrisati ovaj oglas tereta?')) return;
    try {
      await cargoPostsService.remove(id);
      navigate('/cargo');
    } catch {
      setError('Brisanje oglasa nije uspjelo.');
    }
  };

  const handleClose = async () => {
    if (!id || !confirm('Zatvoriti ovaj oglas? Više se neće prikazivati u javnoj pretrazi.')) return;
    setCloseLoading(true);
    setSaveSuccess('');
    setSaveError('');
    try {
      const res = await cargoPostsService.update(id, { status: 'closed' });
      setPost(res.data);
      setSaveSuccess('Oglas je uspješno zatvoren.');
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'Zatvaranje oglasa nije uspjelo.'));
    } finally {
      setCloseLoading(false);
    }
  };

  const startEditing = () => {
    if (!post) return;
    setEditLoadingCity(post.loadingCity || null);
    setEditUnloadingCity(post.unloadingCity || null);
    setEditForm({
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
    if (!editLoadingCity) { setSaveError('Odaberite mjesto utovara.'); return; }
    if (!editUnloadingCity) { setSaveError('Odaberite mjesto istovara.'); return; }
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (editForm.loadingDate < todayStr && editForm.loadingDate !== post?.loadingDate) {
      setSaveError('Datum utovara ne može biti u prošlosti.');
      return;
    }
    setSaveError('');
    setSaveSuccess('');
    setSaveLoading(true);

    try {
      const payload: Record<string, any> = {
        loadingCityId: editLoadingCity.id,
        unloadingCityId: editUnloadingCity.id,
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
      setSaveSuccess('Oglas je uspješno ažuriran.');
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'Spremanje promjena nije uspjelo.'));
    } finally {
      setSaveLoading(false);
    }
  };

  const isOwner = user && post?.company?.userId === user.id;

  if (loading) return <div className="page-container"><p className="loading">Učitavanje...</p></div>;
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>;
  if (!post) return null;

  const fromLabel = locationLabel(post, 'loading');
  const toLabel = locationLabel(post, 'unloading');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/cargo" className="back-link">← Natrag na terete</Link>
          <div className="detail-title-row">
            <h1>{fromLabel} → {toLabel}</h1>
            <StatusBadge status={post.status} />
          </div>
        </div>
        {isOwner && !isEditing && (
          <div className="action-buttons">
            {post.status === 'active' && (
              <button className="btn-secondary" onClick={handleClose} disabled={closeLoading}>
                {closeLoading ? 'Zatvaranje...' : 'Zatvori oglas'}
              </button>
            )}
            <button className="btn-secondary" onClick={startEditing}>Uredi</button>
            <button className="btn-danger" onClick={handleDelete}>Obriši</button>
          </div>
        )}
      </div>

      {saveSuccess && <div className="alert alert-success">{saveSuccess}</div>}

      {isEditing ? (
        <div className="form-card">
          <h2>Uredi oglas tereta</h2>
          {saveError && <div className="alert alert-error">{saveError}</div>}
          <form onSubmit={handleEditSubmit}>
            <div className="form-section-title">Ruta</div>
            <div className="form-row">
              <div className="form-group">
                <label>Mjesto utovara *</label>
                <CityAutocomplete
                  value={editLoadingCity}
                  onChange={setEditLoadingCity}
                  placeholder="Upišite naziv grada…"
                />
              </div>
              <div className="form-group">
                <label>Mjesto istovara *</label>
                <CityAutocomplete
                  value={editUnloadingCity}
                  onChange={setEditUnloadingCity}
                  placeholder="Upišite naziv grada…"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ maxWidth: '200px' }}>
                <label>Datum utovara *</label>
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
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-section-title">Detalji tereta</div>
            <div className="form-row">
              <div className="form-group">
                <label>Vrsta tereta</label>
                <select name="cargoType" value={editForm.cargoType} onChange={handleEditChange}>
                  <option value="">-- Odaberite vrstu --</option>
                  {CARGO_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Potrebno vozilo</label>
                <select name="requiredVehicleType" value={editForm.requiredVehicleType} onChange={handleEditChange}>
                  <option value="">-- Bilo koje vozilo --</option>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Težina (t)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={editForm.weight}
                  onChange={handleEditChange}
                  placeholder="npr. 5.5"
                />
              </div>
              <div className="form-group">
                <label>Dimenzije (DxŠxV)</label>
                <input
                  name="dimensions"
                  value={editForm.dimensions}
                  onChange={handleEditChange}
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
                value={editForm.price}
                onChange={handleEditChange}
                placeholder="npr. 450"
              />
            </div>

            <div className="form-group">
              <label>Napomene</label>
              <textarea
                name="note"
                value={editForm.note}
                onChange={handleEditChange}
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                Odustani
              </button>
              <button type="submit" className="btn-primary-teal" disabled={saveLoading}>
                {saveLoading ? 'Spremanje...' : 'Spremi promjene'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="detail-layout">
          <div className="detail-card">
            <h2>Podaci o teretu</h2>
            <div className="detail-grid">
              <div><span className="label">Mjesto utovara</span><p>{fromLabel}</p></div>
              <div><span className="label">Mjesto istovara</span><p>{toLabel}</p></div>
              <div><span className="label">Datum utovara</span><p>{post.loadingDate}</p></div>
              <div><span className="label">Vrsta tereta</span><p>{post.cargoType || '—'}</p></div>
              <div><span className="label">Težina</span><p>{post.weight ? `${post.weight} t` : '—'}</p></div>
              <div><span className="label">Dimenzije</span><p>{post.dimensions || '—'}</p></div>
              <div><span className="label">Potrebno vozilo</span><p>{post.requiredVehicleType || '—'}</p></div>
              <div><span className="label">Cijena</span><p>{post.price ? `€${post.price}` : 'Po dogovoru'}</p></div>
            </div>
            {post.note && (
              <div className="detail-note">
                <span className="label">Napomene</span>
                <p>{post.note}</p>
              </div>
            )}
          </div>

          {post.company && (
            <div className="detail-card">
              <h2>Kontakt / Tvrtka</h2>
              <div className="detail-grid">
                <div><span className="label">Tvrtka</span><p>{post.company.companyName}</p></div>
                <div><span className="label">Vrsta</span><p>{post.company.companyType}</p></div>
                <div><span className="label">Lokacija</span><p>{post.company.city}, {post.company.country}</p></div>
                {post.company.phone && <div><span className="label">Telefon</span><p>{post.company.phone}</p></div>}
                {post.company.email && <div><span className="label">E-mail</span><p>{post.company.email}</p></div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
