import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { point, lineString, nearestPointOnLine, length } from '@turf/turf';
import { VehiclePostRouteCity } from './vehicle-post-route-city.entity';
import { City } from '../cities/city.entity';
import { RoutingService } from './routing.service';

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
  ): Promise<VehiclePostRouteCity[]> {
    await this.routeCityRepo.delete({ vehiclePostId });

    const maxDistKm = parseFloat(
      this.configService.get<string>('ROUTE_CITY_MAX_DISTANCE_KM') || '15',
    );

    if (!destCity) {
      // No destination — just record the origin city
      const entity = this.routeCityRepo.create({
        vehiclePostId,
        cityId: originCity.id,
        orderIndex: 0,
        distanceFromStartKm: 0,
        distanceFromRouteKm: 0,
      });
      return this.routeCityRepo.save([entity]);
    }

    // Attempt to get a driving route
    const route = await this.routingService.getRoute(
      { lat: originCity.latitude, lng: originCity.longitude },
      { lat: destCity.latitude, lng: destCity.longitude },
    );

    if (route && route.coordinates.length >= 2) {
      return this.generateFromRoute(vehiclePostId, route.coordinates, maxDistKm);
    }

    // Fallback: save only origin + destination
    this.logger.warn(
      `Route fetch failed for vehicle post ${vehiclePostId} — using origin+destination fallback`,
    );
    const fallback = [
      this.routeCityRepo.create({
        vehiclePostId,
        cityId: originCity.id,
        orderIndex: 0,
        distanceFromStartKm: 0,
        distanceFromRouteKm: 0,
      }),
      this.routeCityRepo.create({
        vehiclePostId,
        cityId: destCity.id,
        orderIndex: 1,
        distanceFromStartKm: 0,
        distanceFromRouteKm: 0,
      }),
    ];
    return this.routeCityRepo.save(fallback);
  }

  private async generateFromRoute(
    vehiclePostId: string,
    coordinates: { lat: number; lng: number }[],
    maxDistKm: number,
  ): Promise<VehiclePostRouteCity[]> {
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

    const entities = projections.map((p, i) =>
      this.routeCityRepo.create({
        vehiclePostId,
        cityId: p.cityId,
        orderIndex: i,
        distanceFromStartKm: p.distanceFromStartKm,
        distanceFromRouteKm: p.distanceFromRouteKm,
      }),
    );

    return this.routeCityRepo.save(entities);
  }

  async findByVehiclePostId(vehiclePostId: string): Promise<VehiclePostRouteCity[]> {
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
