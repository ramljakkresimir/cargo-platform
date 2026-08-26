import { Repository } from 'typeorm';
import { lineString } from '@turf/helpers';
import length from '@turf/length';
import { CityDistanceService } from './city-distance.service';
import { CityDistance } from './city-distance.entity';
import { City } from '../cities/city.entity';
import { RoutingService } from './routing.service';

type MockDistanceRepo = {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
};
type MockCityRepo = { findOne: jest.Mock };
type MockRoutingService = { getRoute: jest.Mock };

const CITY_A = {
  id: 'city-a',
  name: 'Sarajevo',
  latitude: 43.8563,
  longitude: 18.4131,
};
// ~124 km north of city-a (1 degree of latitude is not exactly 111.19 km on a great
// circle, so the "rounds to nearest 10" expectation below is computed with the same
// turf functions the service uses, rather than a hand-calculated constant).
const CITY_B = {
  id: 'city-b',
  name: 'Zenica',
  latitude: 44.98,
  longitude: 18.4131,
};
// Effectively the same point — real routes never collapse to ~0 km, this is only to
// exercise the "rounds to zero is treated as unresolvable" guard.
const CITY_C = {
  id: 'city-c',
  name: 'Adjacent',
  latitude: 43.8564,
  longitude: 18.4131,
};

function expectedRoundedKm(coords: { lat: number; lng: number }[]): number {
  const line = lineString(coords.map((c) => [c.lng, c.lat]));
  const km = length(line, { units: 'kilometers' });
  return Math.round(km / 10) * 10;
}

describe('CityDistanceService', () => {
  let service: CityDistanceService;
  let distanceRepo: MockDistanceRepo;
  let cityRepo: MockCityRepo;
  let routingService: MockRoutingService;

  function cityFindOne(id: string) {
    return [CITY_A, CITY_B, CITY_C].find((c) => c.id === id) ?? null;
  }

  beforeEach(() => {
    distanceRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn((row: unknown) => Promise.resolve(row)),
      create: jest.fn((row: unknown) => row),
    };
    cityRepo = {
      findOne: jest.fn(({ where: { id } }: { where: { id: string } }) =>
        Promise.resolve(cityFindOne(id)),
      ),
    };
    routingService = { getRoute: jest.fn() };
    service = new CityDistanceService(
      distanceRepo as unknown as Repository<CityDistance>,
      cityRepo as unknown as Repository<City>,
      routingService as unknown as RoutingService,
    );
  });

  it('returns null for a same-city pair without calling routing or the DB', async () => {
    const [result] = await service.getDistances([
      { fromCityId: 'city-a', toCityId: 'city-a' },
    ]);
    expect(result.distanceKm).toBeNull();
    expect(routingService.getRoute).not.toHaveBeenCalled();
    expect(cityRepo.findOne).not.toHaveBeenCalled();
  });

  it('resolves a new pair via the routing service, rounds to the nearest 10 km, and caches it', async () => {
    const coords = [
      { lat: CITY_A.latitude, lng: CITY_A.longitude },
      { lat: CITY_B.latitude, lng: CITY_B.longitude },
    ];
    routingService.getRoute.mockResolvedValue({ coordinates: coords });
    const expected = expectedRoundedKm(coords);

    const [result] = await service.getDistances([
      { fromCityId: 'city-a', toCityId: 'city-b' },
    ]);

    expect(result.distanceKm).toBe(expected);
    expect(distanceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        cityAId: 'city-a',
        cityBId: 'city-b',
        distanceKm: expected,
      }),
    );
  });

  it('serves a cached row without calling the routing service, regardless of pair order', async () => {
    distanceRepo.findOne.mockResolvedValue({
      cityAId: 'city-a',
      cityBId: 'city-b',
      distanceKm: 130,
    });

    const [result] = await service.getDistances([
      { fromCityId: 'city-b', toCityId: 'city-a' },
    ]);

    expect(result.distanceKm).toBe(130);
    expect(routingService.getRoute).not.toHaveBeenCalled();
    expect(distanceRepo.findOne).toHaveBeenCalledWith({
      where: { cityAId: 'city-a', cityBId: 'city-b' },
    });
  });

  it('de-dupes repeated and order-swapped pairs within one batch into a single lookup', async () => {
    routingService.getRoute.mockResolvedValue({
      coordinates: [
        { lat: CITY_A.latitude, lng: CITY_A.longitude },
        { lat: CITY_B.latitude, lng: CITY_B.longitude },
      ],
    });

    const results = await service.getDistances([
      { fromCityId: 'city-a', toCityId: 'city-b' },
      { fromCityId: 'city-b', toCityId: 'city-a' },
      { fromCityId: 'city-a', toCityId: 'city-b' },
    ]);

    expect(routingService.getRoute).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.distanceKm === results[0].distanceKm)).toBe(
      true,
    );
  });

  it('returns null and does not cache when the routing service fails to produce a route', async () => {
    routingService.getRoute.mockResolvedValue(null);

    const [result] = await service.getDistances([
      { fromCityId: 'city-a', toCityId: 'city-b' },
    ]);

    expect(result.distanceKm).toBeNull();
    expect(distanceRepo.save).not.toHaveBeenCalled();
  });

  it('returns null when a city id cannot be resolved', async () => {
    const [result] = await service.getDistances([
      { fromCityId: 'city-a', toCityId: 'missing-city' },
    ]);

    expect(result.distanceKm).toBeNull();
    expect(routingService.getRoute).not.toHaveBeenCalled();
  });

  it('treats a distance that rounds to 0 km as unresolvable rather than caching "~ 0 km"', async () => {
    routingService.getRoute.mockResolvedValue({
      coordinates: [
        { lat: CITY_A.latitude, lng: CITY_A.longitude },
        { lat: CITY_C.latitude, lng: CITY_C.longitude },
      ],
    });

    const [result] = await service.getDistances([
      { fromCityId: 'city-a', toCityId: 'city-c' },
    ]);

    expect(result.distanceKm).toBeNull();
    expect(distanceRepo.save).not.toHaveBeenCalled();
  });
});
