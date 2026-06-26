import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './city.entity';
import { FilterCitiesDto } from './dto/filter-cities.dto';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  async search(filters: FilterCitiesDto): Promise<City[]> {
    const limit = Math.min(filters.limit ?? 20, 50);
    const query = this.cityRepository.createQueryBuilder('city');

    if (filters.search) {
      query.andWhere('city.name ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.country) {
      query.andWhere('city.country = :country', { country: filters.country });
    }

    return query.orderBy('city.name', 'ASC').take(limit).getMany();
  }

  async findById(id: string): Promise<City> {
    const city = await this.cityRepository.findOne({ where: { id } });
    if (!city) throw new NotFoundException(`City ${id} not found`);
    return city;
  }
}
