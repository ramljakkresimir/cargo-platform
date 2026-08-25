import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TruckIcon, PackageIcon, ArrowRightIcon } from '../components/Icons';
import { cargoPostsService } from '../services/cargoPosts.service';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { CargoPost, VehiclePost } from '../types';
import { formatDate } from '../utils/dateUtils';
import heroPhoto768 from '../assets/home/hero-768.jpg';
import heroPhoto1280 from '../assets/home/hero-1280.jpg';
import heroPhoto1920 from '../assets/home/hero-1920.jpg';
import featureTrustPhoto from '../assets/home/feature-trust.jpg';
import featureContactPhoto from '../assets/home/feature-contact.jpg';
import featureRoutesPhoto from '../assets/home/feature-routes.jpg';

const PREVIEW_LIMIT = 3;

const FEATURE_BLOCKS = [
  {
    image: featureTrustPhoto,
    alt: 'Dvije osobe se rukuju nakon dogovora o prijevozu',
    title: 'Provjerene tvrtke',
    text: 'Svaka objava povezana je s registriranim profilom tvrtke. Prije dogovora vidite s kim razgovarate — naziv, sjedište i povijest objava.',
  },
  {
    image: featureContactPhoto,
    alt: 'Muškarac razgovara telefonom dogovarajući prijevoz',
    title: 'Izravan kontakt',
    text: 'Razgovarajte izravno s drugom tvrtkom — bez posrednika. Kontakt je vidljiv uz objavu, dogovor ide vašim tempom.',
  },
  {
    image: featureRoutesPhoto,
    alt: 'Dostavno vozilo s krovnim nosačem vozi autocestom',
    title: 'Stvarne rute',
    text: 'Pretražujte po gradovima koji su vama bitni. Objave prate rute koje vozila već voze, pa se kapacitet ne vozi prazan.',
  },
];

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
    <div className="homepage">
      <section className="hero">
        <img
          src={heroPhoto1920}
          srcSet={`${heroPhoto768} 768w, ${heroPhoto1280} 1280w, ${heroPhoto1920} 1920w`}
          sizes="100vw"
          width={1920}
          height={1080}
          alt="Muškarac utovaruje kartonske kutije u dostavno vozilo"
          className="hero-photo"
          loading="eager"
          fetchPriority="high"
        />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-content-inner">
            <p className="hero-eyebrow">Prijevoz bez posrednika</p>
            <h1>Pronađite prijevoz ili teret na svojoj ruti</h1>
            <p className="hero-lead">
              CargoConnect povezuje tvrtke s dostupnim prijevoznim kapacitetom — brzo, jednostavno i izravno, bez posrednika.
            </p>
            <div className="hero-actions">
              <Link to="/vehicles" className="hero-btn hero-btn-primary">
                Trebam prijevoz
              </Link>
              <Link to="/cargo" className="hero-btn hero-btn-secondary">
                Imam vozilo
              </Link>
            </div>
          </div>
        </div>
      </section>

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

      <section className="features-section">
        <div className="features-container">
          {FEATURE_BLOCKS.map((block, i) => (
            <div className={`feature-row${i % 2 === 1 ? ' reverse' : ''}`} key={block.title}>
              <div className="feature-text">
                <h2>{block.title}</h2>
                <p>{block.text}</p>
              </div>
              <div className="feature-image-wrap">
                <img src={block.image} alt={block.alt} loading="lazy" className="feature-image" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
