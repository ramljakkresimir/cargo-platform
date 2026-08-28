// Imported from individual @turf packages rather than the '@turf/turf' barrel — see the
// comment in route-city.service.ts for why (the barrel pulls in an ESM-only dependency
// chain that breaks ts-jest).
import { lineString } from '@turf/helpers';
import simplify from '@turf/simplify';
import { Coordinate } from './openroute.service';

// Shared by RouteCityService (vehicle posts) and CargoPostsService (cargo posts): the map
// doesn't need thousands of points per route, and it's shipped on every detail-page
// request — tolerance is in degrees; ~0.001° is roughly 100m at these latitudes, visually
// identical to the full-resolution driving polyline at any map zoom level users view.
export function simplifyRouteCoordinates(
  coordinates: Coordinate[],
): Coordinate[] {
  if (coordinates.length <= 2) return coordinates;
  const line = lineString(coordinates.map((c) => [c.lng, c.lat]));
  const simplified = simplify(line, { tolerance: 0.001, highQuality: true });
  return simplified.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
}
