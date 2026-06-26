import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclePostRouteCity } from './vehicle-post-route-city.entity';
import { City } from '../cities/city.entity';
import { OpenRouteService } from './openroute.service';
import { RoutingService } from './routing.service';
import { RouteCityService } from './route-city.service';

@Module({
  imports: [TypeOrmModule.forFeature([VehiclePostRouteCity, City])],
  providers: [OpenRouteService, RoutingService, RouteCityService],
  exports: [RouteCityService, RoutingService],
})
export class RoutingModule {}
