import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclePostRouteCity } from './vehicle-post-route-city.entity';
import { City } from '../cities/city.entity';
import { CityDistance } from './city-distance.entity';
import { OpenRouteService } from './openroute.service';
import { RoutingService } from './routing.service';
import { RouteCityService } from './route-city.service';
import { CityDistanceService } from './city-distance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VehiclePostRouteCity, City, CityDistance]),
  ],
  providers: [
    OpenRouteService,
    RoutingService,
    RouteCityService,
    CityDistanceService,
  ],
  exports: [RouteCityService, RoutingService, CityDistanceService],
})
export class RoutingModule {}
