import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { cargoPostsService } from '../services/cargoPosts.service';
import { ratingsService } from '../services/ratings.service';
import { CargoPost, City, RatingSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { extractErrorMessage } from '../utils/errorUtils';
import CityAutocomplete from '../components/CityAutocomplete';
import DetailView from '../components/detail/DetailView';
import { DetailData } from '../components/detail/types';
import { useCityDistances, pairKey } from '../hooks/useCityDistances';
import { CARGO_TYPES, VEHICLE_TYPES, cargoTypeLabel, vehicleTypeLabel } from '../constants/postTypes';
import { formatDate, formatPostedAtShort } from '../utils/dateUtils';

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
  const { openChatWithUser } = useChat();

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

  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState('');

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

  useEffect(() => {
    // Data fetching over the network — the setState calls in fetchPost's
    // catch/finally are the async result of this effect, not derivable at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) fetchPost(id);
  }, [id]);

  const posterUserId = post?.company?.userId;
  const isOwner = Boolean(user && posterUserId === user.id);

  useEffect(() => {
    if (!posterUserId) return;
    ratingsService.getSummary(posterUserId).then((res) => setRatingSummary(res.data));
    if (user && !isOwner) {
      ratingsService.getMine(posterUserId).then((res) => {
        if (res.data) setMyScore(res.data.score);
      });
    }
  }, [posterUserId, user, isOwner]);

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

  // Auto-open the edit form once the post has loaded, when arriving via the
  // My Posts "Edit" deep-link. Adjusted during render (React's recommended
  // pattern for reacting to a value becoming available) rather than in an effect.
  const [prevPost, setPrevPost] = useState(post);
  if (post !== prevPost) {
    setPrevPost(post);
    if (post && location.state?.startEditing) {
      startEditing();
    }
  }

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
      const payload: Record<string, unknown> = {
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

  const handleContact = () => {
    if (!post?.company) return;
    openChatWithUser({
      recipientUserId: post.company.userId,
      recipientName: post.company.companyName,
      cargoPostId: post.id,
    });
  };

  const handleRate = async (score: number) => {
    if (!posterUserId || ratingSubmitting) return;
    const previous = myScore;
    setMyScore(score);
    setRatingSubmitting(true);
    setRatingError('');
    try {
      await ratingsService.submit({
        ratedUserId: posterUserId,
        score,
        cargoPostId: post?.id,
      });
      const res = await ratingsService.getSummary(posterUserId);
      setRatingSummary(res.data);
    } catch (err) {
      setMyScore(previous);
      setRatingError(extractErrorMessage(err, 'Slanje ocjene nije uspjelo.'));
    } finally {
      setRatingSubmitting(false);
    }
  };

  const distancePairs = useMemo(
    () =>
      post?.loadingCityId && post?.unloadingCityId
        ? [{ fromCityId: post.loadingCityId, toCityId: post.unloadingCityId }]
        : [],
    [post],
  );
  const distances = useCityDistances(distancePairs);
  const distanceKm =
    post?.loadingCityId && post?.unloadingCityId
      ? distances.get(pairKey(post.loadingCityId, post.unloadingCityId)) ?? null
      : null;

  const STATUS_LABELS: Record<string, string> = { active: 'Aktivno', closed: 'Zatvoreno', expired: 'Isteklo' };

  const detailData: DetailData | null = post
    ? {
        mode: 'cargo',
        accent: 'teal',
        modeLabel: 'Teret',
        status: post.status,
        statusLabel: STATUS_LABELS[post.status] ?? post.status,
        extraPillLabel: post.cargoType ? cargoTypeLabel(post.cargoType) : undefined,
        originLabel: locationLabel(post, 'loading'),
        originSubLabel: `Utovar ${formatDate(post.loadingDate)}`,
        destinationLabel: locationLabel(post, 'unloading'),
        destinationSubLabel: 'Mjesto istovara',
        connectorMidLabel: vehicleTypeLabel(post.requiredVehicleType),
        distanceKm,
        factTiles: [
          { label: 'Težina', value: post.weight ? `${post.weight} t` : '—' },
          { label: 'Dimenzije', value: post.dimensions || '—' },
          { label: 'Potrebno vozilo', value: vehicleTypeLabel(post.requiredVehicleType) },
          { label: 'Objavljeno', value: formatPostedAtShort(post.createdAt) },
        ],
        notesTitle: 'Napomene naručitelja',
        notesBody: post.note,
        chips: post.cargoType ? [{ label: cargoTypeLabel(post.cargoType), tone: 'accent' }] : [],
        routeCities: post.routeGeoJson && post.routeGeoJson.length >= 2
          ? [
              { id: 'loading', name: locationLabel(post, 'loading') },
              { id: 'unloading', name: locationLabel(post, 'unloading') },
            ]
          : [],
        routeGeoJson: post.routeGeoJson,
        hasDestinationCity: true,
        routeExplainerLine: 'Ako vozite ovom rutom, teret se može uklopiti bez velikog skretanja.',
        company: post.company,
        ratingSummary,
        priceBlock: { value: post.price ? `€${post.price}` : 'Po dogovoru', sublabel: 'za cijeli teret' },
        isOwner,
        isLoggedIn: Boolean(user),
        ownerActions: isOwner
          ? {
              onEdit: startEditing,
              onClose: post.status === 'active' ? handleClose : undefined,
              closeLoading,
              onDelete: handleDelete,
            }
          : undefined,
        myScore,
        onRate: handleRate,
        ratingSubmitting,
        ratingError,
        onContact: handleContact,
        mobileSummaryPrimary: post.price ? `€${post.price}` : 'Po dogovoru',
        mobileSummarySecondary: `${locationLabel(post, 'loading')} → ${locationLabel(post, 'unloading')}`,
      }
    : null;

  if (loading) return <div className="page-container"><p className="loading">Učitavanje...</p></div>;
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>;
  if (!post || !detailData) return null;

  if (isEditing) {
    return (
      <div className="page-container">
        {saveSuccess && <div className="alert alert-success">{saveSuccess}</div>}
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
              <div className="form-group form-group-w-md">
                <label>Datum utovara *</label>
                <input
                  type="date"
                  name="loadingDate"
                  value={editForm.loadingDate}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group form-group-w-sm">
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

            <div className="form-group form-group-w-lg">
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
      </div>
    );
  }

  return (
    <>
      {saveSuccess && <div className="alert alert-success detail-save-toast">{saveSuccess}</div>}
      <DetailView data={detailData} backHref="/cargo" backLabel="Natrag na terete" />
    </>
  );
}
