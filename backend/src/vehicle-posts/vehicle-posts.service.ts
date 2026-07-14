import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehiclePost } from './vehicle-post.entity';
import { PostStatus } from '../common/enums/post-status.enum';
import { CreateVehiclePostDto } from './dto/create-vehicle-post.dto';
import { UpdateVehiclePostDto } from './dto/update-vehicle-post.dto';
import { FilterVehiclePostsDto } from './dto/filter-vehicle-posts.dto';
import { CitiesService } from '../cities/cities.service';
import { RouteCityService } from '../routing/route-city.service';

function getLocalDateString(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

@Injectable()
export class VehiclePostsService {
  private readonly logger = new Logger(VehiclePostsService.name);

  constructor(
    @InjectRepository(VehiclePost)
    private readonly vehiclePostRepository: Repository<VehiclePost>,
    private readonly citiesService: CitiesService,
    private readonly routeCityService: RouteCityService,
  ) {}

  async create(companyId: string, dto: CreateVehiclePostDto): Promise<VehiclePost> {
    const originCity = await this.citiesService.findById(dto.originCityId).catch(() => {
      throw new BadRequestException(`Origin city not found: ${dto.originCityId}`);
    });

    if (dto.availableFromDate < getLocalDateString()) {
      throw new BadRequestException('Available from date cannot be in the past.');
    }

    let destinationCityName: string | undefined;
    if (dto.destinationCityId) {
      const destCity = await this.citiesService.findById(dto.destinationCityId).catch(() => {
        throw new BadRequestException(`Destination city not found: ${dto.destinationCityId}`);
      });
      destinationCityName = `${destCity.name}, ${destCity.country}`;
    }

    const post = this.vehiclePostRepository.create({
      ...dto,
      companyId,
      availableLocation: `${originCity.name}, ${originCity.country}`,
      destinationPreference: destinationCityName,
    });
    const saved = await this.vehiclePostRepository.save(post);

    // Generate route cities and geometry — failure must not block post creation
    const destCityObj = dto.destinationCityId
      ? await this.citiesService.findById(dto.destinationCityId).catch(() => null)
      : null;
    try {
      const { routeCoordinates } = await this.routeCityService.generateAndSave(saved.id, originCity, destCityObj);
      if (routeCoordinates && routeCoordinates.length > 0) {
        await this.vehiclePostRepository.update(saved.id, { routeGeoJson: routeCoordinates });
      }
    } catch (err: any) {
      this.logger.warn(`Route generation failed for post ${saved.id}: ${err?.message}`);
    }

    return this.findOne(saved.id);
  }

  async findAll(filters: FilterVehiclePostsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    // Route-aware search: when both cities provided, find posts whose routes cover both in order
    if (filters.originCityId && filters.destinationCityId) {
      const ids = await this.routeCityService.findPostIdsOnRoute(
        filters.originCityId,
        filters.destinationCityId,
      );

      if (ids.length === 0) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }

      const query = this.vehiclePostRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.company', 'company')
        .leftJoinAndSelect('post.originCity', 'originCity')
        .leftJoinAndSelect('post.destinationCity', 'destinationCity')
        .where('post.status = :status', { status: PostStatus.ACTIVE })
        .andWhere('post.availableFromDate >= :today', { today: getLocalDateString() })
        .andWhere('post.id IN (:...ids)', { ids })
        .orderBy('post.createdAt', 'DESC');

      if (filters.availableFromDate) {
        query.andWhere('post.availableFromDate = :afd', { afd: filters.availableFromDate });
      }
      if (filters.vehicleType) {
        query.andWhere('post.vehicleType ILIKE :vt', { vt: filters.vehicleType });
      }

      const [data, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // Standard search (single city or text filters)
    const query = this.vehiclePostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.company', 'company')
      .leftJoinAndSelect('post.originCity', 'originCity')
      .leftJoinAndSelect('post.destinationCity', 'destinationCity')
      .where('post.status = :status', { status: PostStatus.ACTIVE })
      .andWhere('post.availableFromDate >= :today', { today: getLocalDateString() })
      .orderBy('post.createdAt', 'DESC');

    if (filters.originCityId) {
      query.andWhere('post.originCityId = :ocId', { ocId: filters.originCityId });
    } else if (filters.availableLocation) {
      query.andWhere('post.availableLocation ILIKE :al', {
        al: `%${filters.availableLocation}%`,
      });
    }

    if (filters.destinationCityId) {
      query.andWhere('post.destinationCityId = :dcId', { dcId: filters.destinationCityId });
    } else if (filters.destinationPreference) {
      query.andWhere('post.destinationPreference ILIKE :dp', {
        dp: `%${filters.destinationPreference}%`,
      });
    }

    if (filters.availableFromDate) {
      query.andWhere('post.availableFromDate = :afd', { afd: filters.availableFromDate });
    }
    if (filters.vehicleType) {
      query.andWhere('post.vehicleType ILIKE :vt', { vt: filters.vehicleType });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<VehiclePost> {
    const post = await this.vehiclePostRepository.findOne({
      where: { id },
      relations: { company: true },
    });
    if (!post) throw new NotFoundException(`Vehicle post ${id} not found`);

    if (post.originCityId) {
      post.originCity = await this.citiesService.findById(post.originCityId).catch(() => null);
    }
    if (post.destinationCityId) {
      post.destinationCity = await this.citiesService.findById(post.destinationCityId).catch(() => null);
    }

    (post as any).routeCities = await this.routeCityService.findByVehiclePostId(id);

    return post;
  }

  async update(id: string, companyId: string, dto: UpdateVehiclePostDto): Promise<VehiclePost> {
    const post = await this.findOne(id);
    if (post.companyId !== companyId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const routeChanged =
      (dto.originCityId !== undefined && dto.originCityId !== post.originCityId) ||
      (dto.destinationCityId !== undefined && dto.destinationCityId !== post.destinationCityId);

    let newOriginCity = post.originCity;
    let newDestCity = post.destinationCity;

    if (dto.originCityId) {
      const city = await this.citiesService.findById(dto.originCityId).catch(() => {
        throw new BadRequestException(`Origin city not found: ${dto.originCityId}`);
      });
      post.availableLocation = `${city.name}, ${city.country}`;
      newOriginCity = city;
    }
    if (dto.destinationCityId !== undefined) {
      if (dto.destinationCityId) {
        const city = await this.citiesService.findById(dto.destinationCityId).catch(() => {
          throw new BadRequestException(`Destination city not found: ${dto.destinationCityId}`);
        });
        post.destinationPreference = `${city.name}, ${city.country}`;
        newDestCity = city;
      } else {
        post.destinationPreference = null;
        newDestCity = null;
      }
    }

    if (dto.availableFromDate !== undefined && dto.availableFromDate < getLocalDateString() && dto.availableFromDate !== post.availableFromDate) {
      throw new BadRequestException('Available from date cannot be in the past.');
    }

    if (dto.status !== undefined && dto.status !== post.status) {
      // Owners may only toggle between active and closed — expired is set exclusively
      // by PostsExpirationService (cron / startup sync / admin manual trigger).
      const ownerAllowedTransitions: Partial<Record<PostStatus, PostStatus[]>> = {
        [PostStatus.ACTIVE]: [PostStatus.CLOSED],
        [PostStatus.CLOSED]: [PostStatus.ACTIVE],
      };
      if (!ownerAllowedTransitions[post.status]?.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot change status from "${post.status}" to "${dto.status}". Owners may only switch between active and closed.`,
        );
      }
      // Reactivating a closed post must not resurrect a post whose date has since passed.
      const effectiveAvailableFromDate = dto.availableFromDate ?? post.availableFromDate;
      if (dto.status === PostStatus.ACTIVE && effectiveAvailableFromDate < getLocalDateString()) {
        throw new BadRequestException('Cannot reactivate a post with a past available-from date.');
      }
    }

    Object.assign(post, dto);
    await this.vehiclePostRepository.save(post);

    if (routeChanged && newOriginCity) {
      try {
        const { routeCoordinates } = await this.routeCityService.generateAndSave(id, newOriginCity, newDestCity ?? null);
        // Always update geometry: set new coordinates or clear stale geometry when ORS failed
        await this.vehiclePostRepository.update(id, { routeGeoJson: routeCoordinates ?? null });
      } catch (err: any) {
        this.logger.warn(`Route regeneration failed for post ${id}: ${err?.message}`);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string, companyId: string): Promise<{ message: string }> {
    const post = await this.findOne(id);
    if (post.companyId !== companyId) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.vehiclePostRepository.remove(post);
    return { message: 'Vehicle post deleted successfully' };
  }

  async findByCompanyId(companyId: string): Promise<VehiclePost[]> {
    const posts = await this.vehiclePostRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
    for (const post of posts) {
      if (post.originCityId) {
        post.originCity = await this.citiesService.findById(post.originCityId).catch(() => null);
      }
      if (post.destinationCityId) {
        post.destinationCity = await this.citiesService.findById(post.destinationCityId).catch(() => null);
      }
    }
    return posts;
  }
}
