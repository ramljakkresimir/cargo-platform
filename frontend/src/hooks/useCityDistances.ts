import { useEffect, useState } from 'react';
import { citiesService, CityDistancePair } from '../services/cities.service';

function pairKey(fromCityId: string, toCityId: string): string {
  return `${fromCityId}:${toCityId}`;
}

const EMPTY_DISTANCES: Map<string, number | null> = new Map();

// Batches a "~ X km" lookup for a page of result cards into one request, cached
// server-side per city pair. Loads asynchronously after the initial render — callers
// just get an empty map until it resolves, so a slow/failed lookup never blocks or
// breaks card rendering; distanceKm is simply absent/null until (if) it arrives.
export function useCityDistances(pairs: CityDistancePair[]): Map<string, number | null> {
  const [distances, setDistances] = useState<Map<string, number | null>>(EMPTY_DISTANCES);
  const key = pairs.map((p) => pairKey(p.fromCityId, p.toCityId)).join(',');

  useEffect(() => {
    if (pairs.length === 0) return;
    let cancelled = false;
    citiesService
      .getDistances(pairs)
      .then((res) => {
        if (cancelled) return;
        const map = new Map<string, number | null>();
        for (const r of res.data.results) {
          map.set(pairKey(r.fromCityId, r.toCityId), r.distanceKm);
        }
        setDistances(map);
      })
      .catch(() => {
        // Distance is a non-essential enhancement — fail silently, cards just hide the line.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // No pairs to resolve — return a stable empty map instead of routing through state.
  return pairs.length === 0 ? EMPTY_DISTANCES : distances;
}

export { pairKey };
