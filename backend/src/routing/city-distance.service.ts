import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { lineString } from '@turf/helpers';
import length from '@turf/length';
import { CityDistance } from './city-distance.entity';
import { City } from '../cities/city.entity';
import { RoutingService } from './routing.service';

export interface CityDistancePairInput {
  fromCityId: string;
  toCityId: string;
}

export interface CityDistancePairResult {
  fromCityId: string;
  toCityId: string;
  distanceKm: number | null;
}

@Injectable()
export class CityDistanceService {
  private readonly logger = new Logger(CityDistanceService.name);

  constructor(
    @InjectRepository(CityDistance)
    private readonly distanceRepo: Repository<CityDistance>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    private readonly routingService: RoutingService,
  ) {}

  async getDistances(
    pairs: CityDistancePairInput[],
  ): Promise<CityDistancePairResult[]> {
    // De-dupe order-insensitive pairs within one batch — the same origin/destination
    // combination repeats a lot across result cards, so resolve each pair once.
    const uniquePairs = new Map<string, CityDistancePairInput>();
    for (const pair of pairs) {
      if (pair.fromCityId === pair.toCityId) continue;
      const key = this.canonicalKey(pair.fromCityId, pair.toCityId);
      if (!uniquePairs.has(key)) uniquePairs.set(key, pair);
    }

    const resolved = new Map<string, number | null>();
    await Promise.all(
      Array.from(uniquePairs.entries()).map(async ([key, pair]) => {
        resolved.set(
          key,
          await this.resolveOne(pair.fromCityId, pair.toCityId),
        );
      }),
    );

    return pairs.map((pair) => ({
      fromCityId: pair.fromCityId,
      toCityId: pair.toCityId,
      distanceKm:
        pair.fromCityId === pair.toCityId
          ? null
          : (resolved.get(this.canonicalKey(pair.fromCityId, pair.toCityId)) ??
            null),
    }));
  }

  private canonicalKey(a: string, b: string): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  private async resolveOne(
    fromCityId: string,
    toCityId: string,
  ): Promise<number | null> {
    const [cityAId, cityBId] =
      fromCityId < toCityId ? [fromCityId, toCityId] : [toCityId, fromCityId];

    const cached = await this.distanceRepo.findOne({
      where: { cityAId, cityBId },
    });
    if (cached) return cached.distanceKm;

    const [cityA, cityB] = await Promise.all([
      this.cityRepo.findOne({ where: { id: cityAId } }),
      this.cityRepo.findOne({ where: { id: cityBId } }),
    ]);
    if (!cityA || !cityB) return null;

    const route = await this.routingService.getRoute(
      { lat: cityA.latitude, lng: cityA.longitude },
      { lat: cityB.latitude, lng: cityB.longitude },
    );
    if (!route || route.coordinates.length < 2) {
      this.logger.warn(
        `Distance route fetch failed for city pair ${cityAId} <-> ${cityBId}`,
      );
      return null;
    }

    const line = lineString(route.coordinates.map((c) => [c.lng, c.lat]));
    const km = length(line, { units: 'kilometers' });
    const rounded = Math.round(km / 10) * 10;
    // A rounded-to-zero distance reads like an error, not a real trip — treat it the
    // same as "unresolvable" rather than showing "~ 0 km".
    if (rounded <= 0) return null;

    try {
      await this.distanceRepo.save(
        this.distanceRepo.create({ cityAId, cityBId, distanceKm: rounded }),
      );
    } catch {
      // Unique constraint race — a concurrent request already cached this pair.
      // The computed value is still correct, so just return it.
    }

    return rounded;
  }
}
