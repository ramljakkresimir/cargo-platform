import { useEffect, useState } from 'react';
import RouteMap from '../RouteMap';
import CitiesStepper from './CitiesStepper';
import { DetailRouteCity } from './types';
import { RouteCoordinate } from '../../types';
import { XIcon } from '../Icons';

interface Props {
  originLabel: string;
  destinationLabel: string;
  distanceKm?: number | null;
  routeGeoJson?: RouteCoordinate[] | null;
  routeCities: DetailRouteCity[];
  explainerLine: string;
  hasDestination: boolean;
}

export default function RouteMapCard({
  originLabel,
  destinationLabel,
  distanceKm,
  routeGeoJson,
  routeCities,
  explainerLine,
  hasDestination,
}: Props) {
  const [fullView, setFullView] = useState(false);
  const hasMap = Boolean(routeGeoJson && routeGeoJson.length >= 2);

  useEffect(() => {
    if (!fullView) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullView(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [fullView]);

  const subtitleParts = [`${originLabel} → ${destinationLabel}`];
  if (distanceKm != null) subtitleParts.push(`~ ${distanceKm} km`);

  return (
    <div className="detail-card detail-map-card">
      <div className="detail-map-card-header">
        <div>
          <h2 className="detail-card-title">Karta rute</h2>
          <p className="detail-map-subtitle">{subtitleParts.join(' · ')}</p>
        </div>
        {hasMap && (
          <button type="button" className="detail-map-open-link" onClick={() => setFullView(true)}>
            Otvori cijeli prikaz
          </button>
        )}
      </div>

      {hasMap ? (
        <div className="detail-map-frame">
          <RouteMap coordinates={routeGeoJson!} originName={originLabel} destinationName={destinationLabel} />
        </div>
      ) : (
        <div className="route-map-unavailable">
          Karta rute nije dostupna za ovaj oglas.
          {!hasDestination && <span> Postavite odredišni grad kako biste omogućili prikaz rute.</span>}
        </div>
      )}

      {routeCities.length > 0 && (
        <div className="detail-stepper-section">
          <div className="detail-stepper-header">
            <h3>Gradovi na ruti</h3>
            {routeCities.length > 2 && <span className="detail-stepper-hint">unutar 15 km od rute</span>}
          </div>
          <CitiesStepper cities={routeCities} />
          <p className="detail-route-explainer">{explainerLine}</p>
        </div>
      )}

      {fullView && hasMap && (
        <div className="detail-map-modal-backdrop" onClick={() => setFullView(false)}>
          <div className="detail-map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-map-modal-header">
              <h2 className="detail-card-title">Karta rute</h2>
              <button
                type="button"
                className="detail-map-modal-close"
                onClick={() => setFullView(false)}
                aria-label="Zatvori"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="detail-map-modal-frame">
              <RouteMap coordinates={routeGeoJson!} originName={originLabel} destinationName={destinationLabel} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
