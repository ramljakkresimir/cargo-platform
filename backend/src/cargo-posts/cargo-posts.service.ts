import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoPost } from './cargo-post.entity';
import { PostStatus } from '../common/enums/post-status.enum';
import { CreateCargoPostDto } from './dto/create-cargo-post.dto';
import { UpdateCargoPostDto } from './dto/update-cargo-post.dto';
import { FilterCargoPostsDto } from './dto/filter-cargo-posts.dto';
import { CitiesService } from '../cities/cities.service';

function getLocalDateString(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

@Injectable()
export class CargoPostsService {
  constructor(
    @InjectRepository(CargoPost)
    private readonly cargoPostRepository: Repository<CargoPost>,
    private readonly citiesService: CitiesService,
  ) {}

  async create(companyId: string, dto: CreateCargoPostDto): Promise<CargoPost> {
    const loadingCity = await this.citiesService.findById(dto.loadingCityId).catch(() => {
      throw new BadRequestException(`Loading city not found: ${dto.loadingCityId}`);
    });
    const unloadingCity = await this.citiesService.findById(dto.unloadingCityId).catch(() => {
      throw new BadRequestException(`Unloading city not found: ${dto.unloadingCityId}`);
    });

    if (dto.loadingDate < getLocalDateString()) {
      throw new BadRequestException('Loading date cannot be in the past.');
    }

    const post = this.cargoPostRepository.create({
      ...dto,
      companyId,
      loadingLocation: `${loadingCity.name}, ${loadingCity.country}`,
      unloadingLocation: `${unloadingCity.name}, ${unloadingCity.country}`,
    });
    const saved = await this.cargoPostRepository.save(post);
    return this.findOne(saved.id);
  }

  async findAll(filters: FilterCargoPostsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const query = this.cargoPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.company', 'company')
      .leftJoinAndSelect('post.loadingCity', 'loadingCity')
      .leftJoinAndSelect('post.unloadingCity', 'unloadingCity')
      .where('post.status = :status', { status: PostStatus.ACTIVE })
      .andWhere('post.loadingDate >= :today', { today: getLocalDateString() })
      .orderBy('post.createdAt', 'DESC');

    if (filters.loadingCityId) {
      query.andWhere('post.loadingCityId = :lcId', { lcId: filters.loadingCityId });
    } else if (filters.loadingLocation) {
      query.andWhere('post.loadingLocation ILIKE :ll', {
        ll: `%${filters.loadingLocation}%`,
      });
    }

    if (filters.unloadingCityId) {
      query.andWhere('post.unloadingCityId = :ucId', { ucId: filters.unloadingCityId });
    } else if (filters.unloadingLocation) {
      query.andWhere('post.unloadingLocation ILIKE :ul', {
        ul: `%${filters.unloadingLocation}%`,
      });
    }

    if (filters.loadingDate) {
      query.andWhere('post.loadingDate = :ld', { ld: filters.loadingDate });
    }
    if (filters.cargoType) {
      query.andWhere('post.cargoType ILIKE :ct', { ct: filters.cargoType });
    }
    if (filters.requiredVehicleType) {
      query.andWhere('post.requiredVehicleType ILIKE :rvt', {
        rvt: filters.requiredVehicleType,
      });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<CargoPost> {
    const post = await this.cargoPostRepository.findOne({
      where: { id },
      relations: { company: true },
    });
    if (!post) throw new NotFoundException(`Cargo post ${id} not found`);

    // Load city relations separately (TypeORM object-form relations don't support nested join arrays)
    if (post.loadingCityId) {
      post.loadingCity = await this.citiesService.findById(post.loadingCityId).catch(() => null);
    }
    if (post.unloadingCityId) {
      post.unloadingCity = await this.citiesService.findById(post.unloadingCityId).catch(() => null);
    }
    return post;
  }

  async update(id: string, companyId: string, dto: UpdateCargoPostDto): Promise<CargoPost> {
    const post = await this.findOne(id);
    if (post.companyId !== companyId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    if (dto.loadingCityId) {
      const city = await this.citiesService.findById(dto.loadingCityId).catch(() => {
        throw new BadRequestException(`Loading city not found: ${dto.loadingCityId}`);
      });
      post.loadingLocation = `${city.name}, ${city.country}`;
    }
    if (dto.unloadingCityId) {
      const city = await this.citiesService.findById(dto.unloadingCityId).catch(() => {
        throw new BadRequestException(`Unloading city not found: ${dto.unloadingCityId}`);
      });
      post.unloadingLocation = `${city.name}, ${city.country}`;
    }

    if (dto.loadingDate !== undefined && dto.loadingDate < getLocalDateString() && dto.loadingDate !== post.loadingDate) {
      throw new BadRequestException('Loading date cannot be in the past.');
    }

    Object.assign(post, dto);
    await this.cargoPostRepository.save(post);
    return this.findOne(id);
  }

  async remove(id: string, companyId: string): Promise<{ message: string }> {
    const post = await this.findOne(id);
    if (post.companyId !== companyId) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.cargoPostRepository.remove(post);
    return { message: 'Cargo post deleted successfully' };
  }

  async findByCompanyId(companyId: string): Promise<CargoPost[]> {
    const posts = await this.cargoPostRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
    // Hydrate city relations in bulk
    for (const post of posts) {
      if (post.loadingCityId) {
        post.loadingCity = await this.citiesService.findById(post.loadingCityId).catch(() => null);
      }
      if (post.unloadingCityId) {
        post.unloadingCity = await this.citiesService.findById(post.unloadingCityId).catch(() => null);
      }
    }
    return posts;
  }
}
