import { Controller, Get, Query } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { FilterCitiesDto } from './dto/filter-cities.dto';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  search(@Query() filters: FilterCitiesDto) {
    return this.citiesService.search(filters);
  }
}
