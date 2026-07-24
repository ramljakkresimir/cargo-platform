import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
// Imported from their individual @turf packages rather than the '@turf/turf' barrel:
// the barrel re-exports '@turf/convex', which pulls in 'concaveman' — an ESM-only
// package (with its own nested ESM-only 'rbush'/'quickselect') unrelated to anything
// this file uses, and it broke ts-jest when the app module tree loaded under test.
import { point, lineString } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import simplify from '@turf/simplify';
import { VehiclePostRouteCity } from './vehicle-post-route-city.entity';
import { City } from '../cities/city.entity';
import { RoutingService } from './routing.service';
import { Coordinate } from './openroute.service';

export interface GenerateResult {
  routeCities: VehiclePostRouteCity[];
  routeCoordinates: Coordinate[] | null;
}

@Injectable()
export class RouteCityService {
  private readonly logger = new Logger(RouteCityService.name);

  constructor(
    @InjectRepository(VehiclePostRouteCity)
    private readonly routeCityRepo: Repository<VehiclePostRouteCity>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    private readonly routingService: RoutingService,
    private readonly configService: ConfigService,
  ) {}

  async generateAndSave(
    vehiclePostId: string,
    originCity: City,
    destCity: City | null,
  ): Promise<GenerateResult> {
    const maxDistKm = parseFloat(
      this.configService.get<string>('ROUTE_CITY_MAX_DISTANCE_KM') || '15',
    );

    // Compute the full set of rows to persist BEFORE touching the database — a crash or
    // restart during the (slow, external) route fetch must never leave a post with its
    // old route cities deleted but no new ones saved.
    let rows: Pick<
      VehiclePostRouteCity,
      'cityId' | 'orderIndex' | 'distanceFromStartKm' | 'distanceFromRouteKm'
    >[];
    let routeCoordinates: Coordinate[] | null = null;

    if (!destCity) {
      // No destination — just record the origin city; no route geometry
      rows = [
        {
          cityId: originCity.id,
          orderIndex: 0,
          distanceFromStartKm: 0,
          distanceFromRouteKm: 0,
        },
      ];
    } else {
      const route = await this.routingService.getRoute(
        { lat: originCity.latitude, lng: originCity.longitude },
        { lat: destCity.latitude, lng: destCity.longitude },
      );

      if (route && route.coordinates.length >= 2) {
        // Project against the full-precision route for accurate distance-along-route
        // ordering, but store a simplified polyline — the map doesn't need thousands of
        // points per route, and it's shipped on every detail-page request.
        rows = await this.projectCitiesOntoRoute(route.coordinates, maxDistKm);
        routeCoordinates = this.simplifyRouteCoordinates(route.coordinates);
      } else {
        // Fallback: origin + destination only; no route geometry
        this.logger.warn(
          `Route fetch failed for vehicle post ${vehiclePostId} — using origin+destination fallback`,
        );
        rows = [
          {
            cityId: originCity.id,
            orderIndex: 0,
            distanceFromStartKm: 0,
            distanceFromRouteKm: 0,
          },
          {
            cityId: destCity.id,
            orderIndex: 1,
            distanceFromStartKm: 0,
            distanceFromRouteKm: 0,
          },
        ];
      }
    }

    // Delete the old rows and insert the new ones atomically.
    const routeCities = await this.routeCityRepo.manager.transaction(
      async (manager) => {
        await manager.delete(VehiclePostRouteCity, { vehiclePostId });
        const entities = rows.map((r) =>
          manager.create(VehiclePostRouteCity, { vehiclePostId, ...r }),
        );
        return manager.save(VehiclePostRouteCity, entities);
      },
    );

    return { routeCities, routeCoordinates };
  }

  private simplifyRouteCoordinates(coordinates: Coordinate[]): Coordinate[] {
    if (coordinates.length <= 2) return coordinates;
    const line = lineString(coordinates.map((c) => [c.lng, c.lat]));
    // Tolerance is in degrees; ~0.001° is roughly 100m at these latitudes — visually
    // identical to the full-resolution driving polyline at any map zoom level users view.
    const simplified = simplify(line, { tolerance: 0.001, highQuality: true });
    return simplified.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
  }

  private async projectCitiesOntoRoute(
    coordinates: { lat: number; lng: number }[],
    maxDistKm: number,
  ): Promise<
    Pick<
      VehiclePostRouteCity,
      'cityId' | 'orderIndex' | 'distanceFromStartKm' | 'distanceFromRouteKm'
    >[]
  > {
    const allCities = await this.cityRepo.find();

    const line = lineString(coordinates.map((c) => [c.lng, c.lat]));

    const projections: {
      cityId: string;
      distanceFromStartKm: number;
      distanceFromRouteKm: number;
    }[] = [];

    for (const city of allCities) {
      const pt = point([city.longitude, city.latitude]);
      const nearest = nearestPointOnLine(line, pt, { units: 'kilometers' });
      const distFromRoute: number = nearest.properties.dist ?? Infinity;

      if (distFromRoute <= maxDistKm) {
        projections.push({
          cityId: city.id,
          distanceFromStartKm: nearest.properties.location ?? 0,
          distanceFromRouteKm: distFromRoute,
        });
      }
    }

    // Sort by position along the route
    projections.sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);

    return projections.map((p, i) => ({
      cityId: p.cityId,
      orderIndex: i,
      distanceFromStartKm: p.distanceFromStartKm,
      distanceFromRouteKm: p.distanceFromRouteKm,
    }));
  }

  async findByVehiclePostId(
    vehiclePostId: string,
  ): Promise<VehiclePostRouteCity[]> {
    return this.routeCityRepo.find({
      where: { vehiclePostId },
      relations: { city: true },
      order: { orderIndex: 'ASC' },
    });
  }

  async findPostIdsOnRoute(
    originCityId: string,
    destinationCityId: string,
  ): Promise<string[]> {
    const rows = await this.routeCityRepo
      .createQueryBuilder('rc1')
      .select('rc1.vehiclePostId', 'vehiclePostId')
      .innerJoin(
        VehiclePostRouteCity,
        'rc2',
        'rc2.vehiclePostId = rc1.vehiclePostId AND rc2.cityId = :destId',
        { destId: destinationCityId },
      )
      .where('rc1.cityId = :originId', { originId: originCityId })
      .andWhere('rc1.orderIndex < rc2.orderIndex')
      .distinct(true)
      .getRawMany<{ vehiclePostId: string }>();

    return rows.map((r) => r.vehiclePostId);
  }

  async deleteByVehiclePostId(vehiclePostId: string): Promise<void> {
    await this.routeCityRepo.delete({ vehiclePostId });
  }

  async findCityById(id: string): Promise<City | null> {
    return this.cityRepo.findOne({ where: { id } });
  }
}
