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
          <div className="hero-content-container">
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
        </div>
      </section>

      <div className="steps-section">
        <div className="steps-header">
          <h2>U tri koraka do prijevoznika</h2>
        </div>
        <div className="steps-grid">
          <div className="step">
            <div className="step-illustration">
              <svg className="step-connector" viewBox="0 0 100 240" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 132 Q 50 66 100 102" />
              </svg>
              <div className="step-mock step-mock-choice">
                <div className="choice-row">
                  <span className="choice-row-icon" aria-hidden="true" />
                  <span>Tražim prijevoz</span>
                </div>
                <div className="choice-row choice-row-selected">
                  <span className="choice-row-dot" aria-hidden="true" />
                  <span>Nudim prijevoz</span>
                </div>
              </div>
            </div>
            <div className="step-number">1</div>
            <div className="step-title">Odaberite što tražite</div>
          </div>
          <div className="step">
            <div className="step-illustration">
              <svg className="step-connector" viewBox="0 0 100 240" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 102 Q 50 168 100 132" />
              </svg>
              <div className="step-mock step-mock-route">
                <div className="route-point">
                  <span className="route-marker route-marker-origin" />
                  <div>
                    <div className="route-label">Polazište</div>
                    <div className="route-placeholder-bar" />
                  </div>
                </div>
                <div className="route-connector" />
                <div className="route-point">
                  <span className="route-marker route-marker-destination" />
                  <div>
                    <div className="route-label">Odredište</div>
                    <div className="route-placeholder-bar route-placeholder-bar-short" />
                  </div>
                </div>
                <span className="step-chip step-chip-weight">18 t</span>
              </div>
            </div>
            <div className="step-number">2</div>
            <div className="step-title">Unesite polazište i odredište</div>
          </div>
          <div className="step">
            <div className="step-illustration">
              <div className="step-mock step-mock-offers">
                <div className="offer-row">
                  <span className="offer-row-icon" aria-hidden="true" />
                  <span className="offer-price">420 €</span>
                </div>
                <div className="offer-row offer-row-selected">
                  <span className="offer-row-icon" aria-hidden="true" />
                  <span className="offer-price">380 €</span>
                </div>
                <span className="step-chip step-chip-cta">Pošalji upit</span>
              </div>
            </div>
            <div className="step-number">3</div>
            <div className="step-title">Kontaktirajte odgovarajuću tvrtku</div>
          </div>
        </div>

        <div className="steps-mobile-list">
          <div className="steps-mobile-item">
            <div className="steps-mobile-track">
              <div className="steps-mobile-badge">1</div>
              <div className="steps-mobile-line" />
            </div>
            <div className="steps-mobile-content">
              <h3 className="steps-mobile-title">Odaberite što tražite</h3>
              <div className="step-mock step-mock-choice">
                <div className="choice-row">
                  <span className="choice-row-icon" aria-hidden="true" />
                  <span>Tražim prijevoz</span>
                </div>
                <div className="choice-row choice-row-selected">
                  <span className="choice-row-dot" aria-hidden="true" />
                  <span>Nudim prijevoz</span>
                </div>
              </div>
            </div>
          </div>

          <div className="steps-mobile-item">
            <div className="steps-mobile-track">
              <div className="steps-mobile-badge">2</div>
              <div className="steps-mobile-line" />
            </div>
            <div className="steps-mobile-content">
              <h3 className="steps-mobile-title">Unesite polazište i odredište</h3>
              <div className="step-mock step-mock-route">
                <div className="route-point">
                  <span className="route-marker route-marker-origin" />
                  <div>
                    <div className="route-label">Polazište</div>
                    <div className="route-placeholder-bar" />
                  </div>
                </div>
                <div className="route-connector" />
                <div className="route-point">
                  <span className="route-marker route-marker-destination" />
                  <div>
                    <div className="route-label">Odredište</div>
                    <div className="route-placeholder-bar route-placeholder-bar-short" />
                  </div>
                </div>
                <span className="step-chip step-chip-weight">18 t</span>
              </div>
            </div>
          </div>

          <div className="steps-mobile-item">
            <div className="steps-mobile-track">
              <div className="steps-mobile-badge">3</div>
            </div>
            <div className="steps-mobile-content">
              <h3 className="steps-mobile-title">Kontaktirajte odgovarajuću tvrtku</h3>
              <div className="step-mock step-mock-offers">
                <div className="offer-row">
                  <span className="offer-row-icon" aria-hidden="true" />
                  <span className="offer-price">420 €</span>
                </div>
                <div className="offer-row offer-row-selected">
                  <span className="offer-row-icon" aria-hidden="true" />
                  <span className="offer-price">380 €</span>
                </div>
              </div>
              <div className="steps-mobile-cta-button">Pošalji upit</div>
            </div>
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
