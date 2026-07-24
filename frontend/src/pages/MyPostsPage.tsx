import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { cargoPostsService } from '../services/cargoPosts.service';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { CargoPost, VehiclePost } from '../types';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { vehicleTypeLabel } from '../constants/postTypes';

export default function MyPostsPage() {
  const navigate = useNavigate();

  const [cargoPosts, setCargoPosts] = useState<CargoPost[]>([]);
  const [vehiclePosts, setVehiclePosts] = useState<VehiclePost[]>([]);
  const [cargoLoading, setCargoLoading] = useState(true);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [cargoError, setCargoError] = useState('');
  const [vehicleError, setVehicleError] = useState('');

  const fetchCargoPosts = async () => {
    try {
      const res = await cargoPostsService.getMine();
      setCargoPosts(res.data);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setCargoPosts([]);
      } else {
        setCargoError('Učitavanje oglasa tereta nije uspjelo.');
      }
    } finally {
      setCargoLoading(false);
    }
  };

  const fetchVehiclePosts = async () => {
    try {
      const res = await vehiclePostsService.getMine();
      setVehiclePosts(res.data);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setVehiclePosts([]);
      } else {
        setVehicleError('Učitavanje oglasa vozila nije uspjelo.');
      }
    } finally {
      setVehicleLoading(false);
    }
  };

  useEffect(() => {
    // Data fetching over the network — the setState calls in these functions'
    // catch/finally are the async result of this effect, not derivable at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCargoPosts();
    fetchVehiclePosts();
  }, []);

  const handleCloseCargo = async (id: string) => {
    if (!confirm('Zatvoriti ovaj oglas tereta? Više se neće prikazivati u javnoj pretrazi.')) return;
    try {
      const res = await cargoPostsService.update(id, { status: 'closed' });
      setCargoPosts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
    } catch {
      setCargoError('Zatvaranje oglasa tereta nije uspjelo.');
    }
  };

  const handleDeleteCargo = async (id: string) => {
    if (!confirm('Obrisati ovaj oglas tereta?')) return;
    try {
      await cargoPostsService.remove(id);
      setCargoPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setCargoError('Brisanje oglasa tereta nije uspjelo.');
    }
  };

  const handleCloseVehicle = async (id: string) => {
    if (!confirm('Zatvoriti ovaj oglas vozila? Više se neće prikazivati u javnoj pretrazi.')) return;
    try {
      const res = await vehiclePostsService.update(id, { status: 'closed' });
      setVehiclePosts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
    } catch {
      setVehicleError('Zatvaranje oglasa vozila nije uspjelo.');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Obrisati ovaj oglas vozila?')) return;
    try {
      await vehiclePostsService.remove(id);
      setVehiclePosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setVehicleError('Brisanje oglasa vozila nije uspjelo.');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('hr-HR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Moje objave</h1>
          <p className="page-subtitle">Svi oglasi tereta i vozila koje ste objavili</p>
        </div>
        <div className="action-buttons">
          <Link to="/cargo/new" className="btn-secondary">+ Objavi teret</Link>
          <Link to="/vehicles/new" className="btn-primary">+ Objavi vozilo</Link>
        </div>
      </div>

      {/* ── Cargo Posts ──────────────────────────────────────────────── */}
      <section className="post-section">
        <h2 className="post-section-title">Moji tereti</h2>

        {cargoError && <div className="alert alert-error">{cargoError}</div>}

        {cargoLoading ? (
          <p className="loading">Učitavanje...</p>
        ) : cargoPosts.length === 0 ? (
          <EmptyState
            message="Još niste objavili nijedan teret."
            action={<Link to="/cargo/new" className="btn-primary-teal">Objavi teret</Link>}
          />
        ) : (
          <div className="result-list">
            {cargoPosts.map((post) => (
              <div className="post-card" key={post.id}>
                <div className="post-card-main">
                  <div className="post-card-route">
                    {post.loadingCity?.name || post.loadingLocation || '—'}
                    <span className="arrow"> → </span>
                    {post.unloadingCity?.name || post.unloadingLocation || '—'}
                  </div>
                  <div className="post-card-meta">
                    <span>Utovar {post.loadingDate}</span>
                    <StatusBadge status={post.status} />
                    <span>Objavljeno {formatDate(post.createdAt)}</span>
                  </div>
                </div>
                <div className="post-card-actions">
                  <Link to={`/cargo/${post.id}`} className="table-link">Pregled</Link>
                  <button
                    className="table-link"
                    onClick={() => navigate(`/cargo/${post.id}`, { state: { startEditing: true } })}
                  >
                    Uredi
                  </button>
                  {post.status === 'active' && (
                    <button
                      className="table-link warning"
                      onClick={() => handleCloseCargo(post.id)}
                    >
                      Zatvori
                    </button>
                  )}
                  <button
                    className="table-link danger"
                    onClick={() => handleDeleteCargo(post.id)}
                  >
                    Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Vehicle Posts ─────────────────────────────────────────────── */}
      <section className="post-section">
        <h2 className="post-section-title">Moja vozila</h2>

        {vehicleError && <div className="alert alert-error">{vehicleError}</div>}

        {vehicleLoading ? (
          <p className="loading">Učitavanje...</p>
        ) : vehiclePosts.length === 0 ? (
          <EmptyState
            message="Još niste objavili nijedno vozilo."
            action={<Link to="/vehicles/new" className="btn-primary">Objavi vozilo</Link>}
          />
        ) : (
          <div className="result-list">
            {vehiclePosts.map((post) => (
              <div className="post-card" key={post.id}>
                <div className="post-card-main">
                  <div className="post-card-route">
                    {post.originCity?.name || post.availableLocation || '—'}
                    <span className="arrow"> → </span>
                    {post.destinationCity?.name || post.destinationPreference || '—'}
                  </div>
                  <div className="post-card-meta">
                    <span>{vehicleTypeLabel(post.vehicleType)}</span>
                    <StatusBadge status={post.status} />
                    <span>Objavljeno {formatDate(post.createdAt)}</span>
                  </div>
                </div>
                <div className="post-card-actions">
                  <Link to={`/vehicles/${post.id}`} className="table-link">Pregled</Link>
                  <button
                    className="table-link"
                    onClick={() => navigate(`/vehicles/${post.id}`, { state: { startEditing: true } })}
                  >
                    Uredi
                  </button>
                  {post.status === 'active' && (
                    <button
                      className="table-link warning"
                      onClick={() => handleCloseVehicle(post.id)}
                    >
                      Zatvori
                    </button>
                  )}
                  <button
                    className="table-link danger"
                    onClick={() => handleDeleteVehicle(post.id)}
                  >
                    Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
