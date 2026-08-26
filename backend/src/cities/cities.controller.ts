import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { CitiesService } from './cities.service';
import { FilterCitiesDto } from './dto/filter-cities.dto';
import { CityDistancePairsDto } from './dto/city-distance-pairs.dto';
import { CityDistanceService } from '../routing/city-distance.service';

@Controller('cities')
export class CitiesController {
  constructor(
    private readonly citiesService: CitiesService,
    private readonly cityDistanceService: CityDistanceService,
  ) {}

  @Get()
  search(@Query() filters: FilterCitiesDto) {
    return this.citiesService.search(filters);
  }

  // Batched road-distance lookup for a set of city pairs, used to show "~ X km" on
  // search result cards without blocking the initial render on an external routing call.
  @Post('distances')
  @HttpCode(HttpStatus.OK)
  async getDistances(@Body() dto: CityDistancePairsDto) {
    const results = await this.cityDistanceService.getDistances(dto.pairs);
    return { results };
  }
}
