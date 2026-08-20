import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TruckIcon, PackageIcon, ArrowRightIcon } from '../components/Icons';
import { cargoPostsService } from '../services/cargoPosts.service';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { CargoPost, VehiclePost } from '../types';
import { formatDate } from '../utils/dateUtils';

const PREVIEW_LIMIT = 3;

function cargoRouteLabel(post: CargoPost): string {
  const from = post.loadingCity?.name || post.loadingLocation || '—';
  const to = post.unloadingCity?.name || post.unloadingLocation || '—';
  return `${from} → ${to}`;
}

function vehicleRouteLabel(post: VehiclePost): string {
  const from = post.originCity?.name || post.availableLocation || '—';
  const to = post.destinationCity?.name || post.destinationPreference || 'Fleksibilno';
  return `${from} → ${to}`;
}

export default function HomePage() {
  const [recentCargo, setRecentCargo] = useState<CargoPost[]>([]);
  const [recentVehicles, setRecentVehicles] = useState<VehiclePost[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      cargoPostsService.getAll({ limit: PREVIEW_LIMIT }),
      vehiclePostsService.getAll({ limit: PREVIEW_LIMIT }),
    ])
      .then(([cargoRes, vehicleRes]) => {
        setRecentCargo(cargoRes.data.data);
        setRecentVehicles(vehicleRes.data.data);
      })
      .catch(() => {
        // Preview is a non-essential enhancement — fail silently and just show nothing
      })
      .finally(() => setPreviewLoading(false));
  }, []);

  const hasAnyRecent = recentCargo.length > 0 || recentVehicles.length > 0;

  return (
    <div>
      <div className="hero">
        <h1>Pronađite prijevoz ili teret na svojoj ruti</h1>
        <p className="hero-subhead">
          CargoConnect povezuje tvrtke s dostupnim prijevoznim kapacitetom — brzo, jednostavno i izravno, bez posrednika.
        </p>

        <div className="hero-cta-grid">
          <Link to="/vehicles" className="cta-card accent-blue">
            <div className="cta-card-icon blue">
              <TruckIcon size={28} />
            </div>
            <div className="cta-card-title">Trebam prijevoz</div>
            <div className="cta-card-desc">
              Pronađite vozilo koje odgovara mjestu utovara i odredištu vašeg tereta.
            </div>
            <div className="cta-card-link blue">
              Pronađi prijevoz <ArrowRightIcon size={14} />
            </div>
          </Link>

          <Link to="/cargo" className="cta-card accent-teal">
            <div className="cta-card-icon teal">
              <PackageIcon size={28} />
            </div>
            <div className="cta-card-title">Imam vozilo</div>
            <div className="cta-card-desc">
              Pronađite teret koji odgovara ruti i slobodnom kapacitetu vašeg vozila.
            </div>
            <div className="cta-card-link teal">
              Pronađi teret <ArrowRightIcon size={14} />
            </div>
          </Link>
        </div>
      </div>

      <div className="steps-section">
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-title">Odaberite što tražite</div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-title">Unesite polazište i odredište</div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-title">Kontaktirajte odgovarajuću tvrtku</div>
          </div>
        </div>
      </div>

      {!previewLoading && hasAnyRecent && (
        <div className="recent-listings-section">
          <div className="recent-listings-columns">
            <div className="recent-listings-column">
              <div className="recent-listings-column-header">
                <h3>Najnoviji tereti</h3>
                <Link to="/cargo" className="recent-listings-view-all">
                  Svi tereti <ArrowRightIcon size={13} />
                </Link>
              </div>
              {recentCargo.length === 0 ? (
                <p className="recent-listings-empty">Trenutno nema aktivnih oglasa tereta.</p>
              ) : (
                recentCargo.map((post) => (
                  <Link to={`/cargo/${post.id}`} className="preview-card" key={post.id}>
                    <span className="preview-card-icon teal"><PackageIcon size={18} /></span>
                    <div>
                      <div className="preview-card-route">{cargoRouteLabel(post)}</div>
                      <div className="preview-card-subline">Utovar {formatDate(post.loadingDate)}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="recent-listings-column">
              <div className="recent-listings-column-header">
                <h3>Najnovija dostupna vozila</h3>
                <Link to="/vehicles" className="recent-listings-view-all">
                  Sva vozila <ArrowRightIcon size={13} />
                </Link>
              </div>
              {recentVehicles.length === 0 ? (
                <p className="recent-listings-empty">Trenutno nema dostupnih vozila.</p>
              ) : (
                recentVehicles.map((post) => (
                  <Link to={`/vehicles/${post.id}`} className="preview-card" key={post.id}>
                    <span className="preview-card-icon blue"><TruckIcon size={18} /></span>
                    <div>
                      <div className="preview-card-route">{vehicleRouteLabel(post)}</div>
                      <div className="preview-card-subline">Dostupno od {formatDate(post.availableFromDate)}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="value-props-section">
        <div className="value-props">
          <div className="value-prop">
            <div className="value-prop-title">Provjerene tvrtke</div>
            <div className="value-prop-desc">Svaka objava povezana je s registriranim profilom tvrtke.</div>
          </div>
          <div className="value-prop">
            <div className="value-prop-title">Izravan kontakt</div>
            <div className="value-prop-desc">Razgovarajte izravno s drugom tvrtkom — bez posrednika.</div>
          </div>
          <div className="value-prop">
            <div className="value-prop-title">Stvarne rute</div>
            <div className="value-prop-desc">Pretražujte po gradovima koji su vama bitni.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
