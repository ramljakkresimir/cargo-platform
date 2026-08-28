import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { ratingsService } from '../services/ratings.service';
import { VehiclePost, City, RatingSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { extractErrorMessage } from '../utils/errorUtils';
import CityAutocomplete from '../components/CityAutocomplete';
import DetailView from '../components/detail/DetailView';
import { DetailData } from '../components/detail/types';
import { useCityDistances, pairKey } from '../hooks/useCityDistances';
import { VEHICLE_TYPES, vehicleTypeLabel } from '../constants/postTypes';
import { formatDate, formatPostedAtShort } from '../utils/dateUtils';

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
  const { openChatWithUser } = useChat();

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

  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState('');

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
      const payload: Record<string, unknown> = {
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

  const handleContact = () => {
    if (!post?.company) return;
    openChatWithUser({
      recipientUserId: post.company.userId,
      recipientName: post.company.companyName,
      vehiclePostId: post.id,
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
        vehiclePostId: post?.id,
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
      post?.originCityId && post?.destinationCityId
        ? [{ fromCityId: post.originCityId, toCityId: post.destinationCityId }]
        : [],
    [post],
  );
  const distances = useCityDistances(distancePairs);
  const distanceKm =
    post?.originCityId && post?.destinationCityId
      ? distances.get(pairKey(post.originCityId, post.destinationCityId)) ?? null
      : null;

  const STATUS_LABELS: Record<string, string> = { active: 'Aktivno', closed: 'Zatvoreno', expired: 'Isteklo' };

  const detailData: DetailData | null = post
    ? {
        mode: 'vehicle',
        accent: 'blue',
        modeLabel: 'Vozilo',
        status: post.status,
        statusLabel: STATUS_LABELS[post.status] ?? post.status,
        originLabel: originLabel(post),
        originSubLabel: `Dostupno od ${formatDate(post.availableFromDate)}`,
        destinationLabel: destLabel(post),
        destinationSubLabel: 'Željeno odredište',
        connectorMidLabel: vehicleTypeLabel(post.vehicleType),
        distanceKm,
        factTiles: [
          { label: 'Vrsta vozila', value: vehicleTypeLabel(post.vehicleType) },
          { label: 'Kapacitet', value: post.capacity ? `${post.capacity} t` : '—' },
          { label: 'Dostupno od', value: formatDate(post.availableFromDate) },
          { label: 'Objavljeno', value: formatPostedAtShort(post.createdAt) },
        ],
        notesTitle: 'Napomene prijevoznika',
        notesBody: post.note,
        chips: [],
        routeCities: (post.routeCities ?? []).map((rc) => ({
          id: rc.id,
          name: rc.city?.name ?? '…',
          country: rc.city?.country,
        })),
        routeGeoJson: post.routeGeoJson,
        hasDestinationCity: Boolean(post.destinationCity),
        routeExplainerLine: 'Utovar i istovar mogući u bilo kojem gradu na ruti — dogovor s prijevoznikom.',
        company: post.company,
        ratingSummary,
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
        mobileSummaryPrimary: `${vehicleTypeLabel(post.vehicleType)}${post.capacity ? ` · ${post.capacity} t` : ''}`,
        mobileSummarySecondary: `${originLabel(post)} → ${destLabel(post)}`,
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
              <div className="form-group form-group-w-sm">
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
      </div>
    );
  }

  return (
    <>
      {saveSuccess && <div className="alert alert-success detail-save-toast">{saveSuccess}</div>}
      <DetailView data={detailData} backHref="/vehicles" backLabel="Natrag na vozila" />
    </>
  );
}
