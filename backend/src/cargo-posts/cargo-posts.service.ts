import {
  Injectable,
  Logger,
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
import { RoutingService } from '../routing/routing.service';
import { simplifyRouteCoordinates } from '../routing/simplify-route';
import { escapeLikePattern } from '../common/utils/escape-like';

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
  private readonly logger = new Logger(CargoPostsService.name);

  constructor(
    @InjectRepository(CargoPost)
    private readonly cargoPostRepository: Repository<CargoPost>,
    private readonly citiesService: CitiesService,
    private readonly routingService: RoutingService,
  ) {}

  async create(companyId: string, dto: CreateCargoPostDto): Promise<CargoPost> {
    const loadingCity = await this.citiesService
      .findById(dto.loadingCityId)
      .catch(() => {
        throw new BadRequestException(
          `Loading city not found: ${dto.loadingCityId}`,
        );
      });
    const unloadingCity = await this.citiesService
      .findById(dto.unloadingCityId)
      .catch(() => {
        throw new BadRequestException(
          `Unloading city not found: ${dto.unloadingCityId}`,
        );
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

    // Generate route geometry for the map — failure must not block post creation
    try {
      const route = await this.routingService.getRoute(
        { lat: loadingCity.latitude, lng: loadingCity.longitude },
        { lat: unloadingCity.latitude, lng: unloadingCity.longitude },
      );
      if (route && route.coordinates.length >= 2) {
        await this.cargoPostRepository.update(saved.id, {
          routeGeoJson: simplifyRouteCoordinates(route.coordinates),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Route generation failed for cargo post ${saved.id}: ${message}`,
      );
    }

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
      query.andWhere('post.loadingCityId = :lcId', {
        lcId: filters.loadingCityId,
      });
    } else if (filters.loadingLocation) {
      query.andWhere('post.loadingLocation ILIKE :ll', {
        ll: `%${escapeLikePattern(filters.loadingLocation)}%`,
      });
    }

    if (filters.unloadingCityId) {
      query.andWhere('post.unloadingCityId = :ucId', {
        ucId: filters.unloadingCityId,
      });
    } else if (filters.unloadingLocation) {
      query.andWhere('post.unloadingLocation ILIKE :ul', {
        ul: `%${escapeLikePattern(filters.unloadingLocation)}%`,
      });
    }

    if (filters.loadingDate) {
      query.andWhere('post.loadingDate >= :ld', { ld: filters.loadingDate });
    }
    if (filters.loadingDateTo) {
      query.andWhere('post.loadingDate <= :ldTo', {
        ldTo: filters.loadingDateTo,
      });
    }
    if (filters.cargoType) {
      query.andWhere('post.cargoType ILIKE :ct', {
        ct: escapeLikePattern(filters.cargoType),
      });
    }
    if (filters.requiredVehicleType) {
      query.andWhere('post.requiredVehicleType ILIKE :rvt', {
        rvt: escapeLikePattern(filters.requiredVehicleType),
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
      relations: { company: true, loadingCity: true, unloadingCity: true },
    });
    if (!post) throw new NotFoundException(`Cargo post ${id} not found`);
    return post;
  }

  async update(
    id: string,
    companyId: string,
    dto: UpdateCargoPostDto,
  ): Promise<CargoPost> {
    const post = await this.findOne(id);
    if (post.companyId !== companyId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const routeChanged =
      (dto.loadingCityId !== undefined &&
        dto.loadingCityId !== post.loadingCityId) ||
      (dto.unloadingCityId !== undefined &&
        dto.unloadingCityId !== post.unloadingCityId);

    let newLoadingCity = post.loadingCity;
    let newUnloadingCity = post.unloadingCity;

    if (dto.loadingCityId) {
      const city = await this.citiesService
        .findById(dto.loadingCityId)
        .catch(() => {
          throw new BadRequestException(
            `Loading city not found: ${dto.loadingCityId}`,
          );
        });
      post.loadingLocation = `${city.name}, ${city.country}`;
      newLoadingCity = city;
    }
    if (dto.unloadingCityId) {
      const city = await this.citiesService
        .findById(dto.unloadingCityId)
        .catch(() => {
          throw new BadRequestException(
            `Unloading city not found: ${dto.unloadingCityId}`,
          );
        });
      post.unloadingLocation = `${city.name}, ${city.country}`;
      newUnloadingCity = city;
    }

    if (
      dto.loadingDate !== undefined &&
      dto.loadingDate < getLocalDateString() &&
      dto.loadingDate !== post.loadingDate
    ) {
      throw new BadRequestException('Loading date cannot be in the past.');
    }

    if (dto.status !== undefined && dto.status !== post.status) {
      // Owners may only toggle between active and closed — expired is set exclusively
      // by PostsExpirationService (cron / startup sync / admin manual trigger).
      const ownerAllowedTransitions: Partial<Record<PostStatus, PostStatus[]>> =
        {
          [PostStatus.ACTIVE]: [PostStatus.CLOSED],
          [PostStatus.CLOSED]: [PostStatus.ACTIVE],
        };
      if (!ownerAllowedTransitions[post.status]?.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot change status from "${post.status}" to "${dto.status}". Owners may only switch between active and closed.`,
        );
      }
      // Reactivating a closed post must not resurrect a post whose date has since passed.
      const effectiveLoadingDate = dto.loadingDate ?? post.loadingDate;
      if (
        dto.status === PostStatus.ACTIVE &&
        effectiveLoadingDate < getLocalDateString()
      ) {
        throw new BadRequestException(
          'Cannot reactivate a post with a past loading date.',
        );
      }
    }

    Object.assign(post, dto);
    await this.cargoPostRepository.save(post);

    if (routeChanged && newLoadingCity && newUnloadingCity) {
      try {
        const route = await this.routingService.getRoute(
          { lat: newLoadingCity.latitude, lng: newLoadingCity.longitude },
          { lat: newUnloadingCity.latitude, lng: newUnloadingCity.longitude },
        );
        // Always update geometry: set new coordinates or clear stale geometry when ORS failed
        await this.cargoPostRepository.update(id, {
          routeGeoJson:
            route && route.coordinates.length >= 2
              ? simplifyRouteCoordinates(route.coordinates)
              : null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Route regeneration failed for cargo post ${id}: ${message}`,
        );
      }
    }

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
    return this.cargoPostRepository.find({
      where: { companyId },
      relations: { loadingCity: true, unloadingCity: true },
      order: { createdAt: 'DESC' },
    });
  }
}
