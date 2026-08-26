import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from './city.entity';
import { CitiesService } from './cities.service';
import { CitiesController } from './cities.controller';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [TypeOrmModule.forFeature([City]), RoutingModule],
  providers: [CitiesService],
  controllers: [CitiesController],
  exports: [CitiesService],
})
export class CitiesModule {}
