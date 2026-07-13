import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { VehiclePost, VehiclePostRouteCity, City } from '../types';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/errorUtils';
import CityAutocomplete from '../components/CityAutocomplete';
import RouteMap from '../components/RouteMap';
import StatusBadge from '../components/StatusBadge';
import { VEHICLE_TYPES, vehicleTypeLabel } from '../constants/postTypes';

const STATUSES = [
  { value: 'active', label: 'Aktivno' },
  { value: 'closed', label: 'Zatvoreno' },
];

function originLabel(post: VehiclePost): string {
  return post.originCity?.name
    ? `${post.originCity.name}, ${post.originCity.country}`
    : (post.availableLocation || '—');
}

function destLabel(post: VehiclePost): string {
  return post.destinationCity?.name
    ? `${post.destinationCity.name}, ${post.destinationCity.country}`
    : (post.destinationPreference || '—');
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [post, setPost] = useState<VehiclePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editOriginCity, setEditOriginCity] = useState<City | null>(null);
  const [editDestCity, setEditDestCity] = useState<City | null>(null);
  const [editForm, setEditForm] = useState({
    availableFromDate: '',
    vehicleType: '',
    capacity: '',
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
      const res = await vehiclePostsService.getOne(postId);
      setPost(res.data);
    } catch {
      setError('Oglas vozila nije pronađen.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Obrisati ovaj oglas vozila?')) return;
    try {
      await vehiclePostsService.remove(id);
      navigate('/vehicles');
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
      const res = await vehiclePostsService.update(id, { status: 'closed' });
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
    setEditOriginCity(post.originCity || null);
    setEditDestCity(post.destinationCity || null);
    setEditForm({
      availableFromDate: post.availableFromDate,
      vehicleType: post.vehicleType,
      capacity: post.capacity != null ? String(post.capacity) : '',
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
    if (!editOriginCity) { setSaveError('Odaberite trenutnu lokaciju.'); return; }
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (editForm.availableFromDate < todayStr && editForm.availableFromDate !== post?.availableFromDate) {
      setSaveError('Datum dostupnosti ne može biti u prošlosti.');
      return;
    }
    setSaveError('');
    setSaveSuccess('');
    setSaveLoading(true);

    try {
      const payload: Record<string, any> = {
        originCityId: editOriginCity.id,
        availableFromDate: editForm.availableFromDate,
        vehicleType: editForm.vehicleType,
        status: editForm.status,
        destinationCityId: editDestCity?.id || null,
      };
      if (editForm.capacity) payload.capacity = parseFloat(editForm.capacity);
      if (editForm.note) payload.note = editForm.note;

      const res = await vehiclePostsService.update(id, payload);
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

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/vehicles" className="back-link">← Natrag na vozila</Link>
          <div className="detail-title-row">
            <h1>{vehicleTypeLabel(post.vehicleType)} — {originLabel(post)}</h1>
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
          <h2>Uredi oglas vozila</h2>
          {saveError && <div className="alert alert-error">{saveError}</div>}
          <form onSubmit={handleEditSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Trenutna lokacija *</label>
                <CityAutocomplete
                  value={editOriginCity}
                  onChange={setEditOriginCity}
                  placeholder="Upišite naziv grada…"
                />
              </div>
              <div className="form-group">
                <label>Dostupno od *</label>
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
                <label>Vrsta vozila *</label>
                <select name="vehicleType" value={editForm.vehicleType} onChange={handleEditChange} required>
                  <option value="">-- Odaberite vrstu vozila --</option>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Kapacitet (t)</label>
                <input
                  type="number"
                  step="0.1"
                  name="capacity"
                  value={editForm.capacity}
                  onChange={handleEditChange}
                  placeholder="npr. 20"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Željeno odredište</label>
                <CityAutocomplete
                  value={editDestCity}
                  onChange={setEditDestCity}
                  placeholder="Neobavezno"
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
              <button type="submit" className="btn-primary" disabled={saveLoading}>
                {saveLoading ? 'Spremanje...' : 'Spremi promjene'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="detail-layout">
          <div className="detail-card">
            <h2>Podaci o vozilu</h2>
            <div className="detail-grid">
              <div><span className="label">Vrsta vozila</span><p>{vehicleTypeLabel(post.vehicleType)}</p></div>
              <div><span className="label">Trenutna lokacija</span><p>{originLabel(post)}</p></div>
              <div><span className="label">Dostupno od</span><p>{post.availableFromDate}</p></div>
              <div><span className="label">Kapacitet</span><p>{post.capacity ? `${post.capacity} t` : '—'}</p></div>
              <div><span className="label">Željeno odredište</span><p>{destLabel(post)}</p></div>
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

          {post.routeCities && post.routeCities.length > 0 && (
            <div className="detail-card">
              <h2>Gradovi na ruti</h2>
              <p className="route-cities-hint">
                Gradovi unutar 15 km od rute ovog vozila, prema redoslijedu
              </p>
              <div className="route-city-chips">
                {post.routeCities.map((rc: VehiclePostRouteCity, i: number) => (
                  <span
                    key={rc.id}
                    className={`route-city-chip${i === 0 || i === post.routeCities!.length - 1 ? ' endpoint' : ''}`}
                  >
                    {rc.city?.name ?? '…'}
                    <span className="route-city-chip-country">{rc.city?.country}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-card">
            <h2>Karta rute</h2>
            {post.routeGeoJson && post.routeGeoJson.length >= 2 ? (
              <RouteMap
                coordinates={post.routeGeoJson}
                originName={originLabel(post)}
                destinationName={post.destinationCity?.name ? destLabel(post) : undefined}
              />
            ) : (
              <div className="route-map-unavailable">
                Karta rute nije dostupna za ovaj oglas.
                {!post.destinationCity && (
                  <span> Postavite odredišni grad kako biste omogućili prikaz rute.</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
