import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoPost } from './cargo-post.entity';
import { PostStatus } from '../common/enums/post-status.enum';
import { CreateCargoPostDto } from './dto/create-cargo-post.dto';
import { UpdateCargoPostDto } from './dto/update-cargo-post.dto';
import { FilterCargoPostsDto } from './dto/filter-cargo-posts.dto';

@Injectable()
export class CargoPostsService {
  constructor(
    @InjectRepository(CargoPost)
    private readonly cargoPostRepository: Repository<CargoPost>,
  ) {}

  async create(companyId: string, dto: CreateCargoPostDto): Promise<CargoPost> {
    const post = this.cargoPostRepository.create({ ...dto, companyId });
    return this.cargoPostRepository.save(post);
  }

  async findAll(filters: FilterCargoPostsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const query = this.cargoPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.company', 'company')
      .where('post.status = :status', { status: PostStatus.ACTIVE })
      .orderBy('post.createdAt', 'DESC');

    if (filters.loadingLocation) {
      // ILIKE is PostgreSQL case-insensitive LIKE
      query.andWhere('post.loadingLocation ILIKE :ll', {
        ll: `%${filters.loadingLocation}%`,
      });
    }
    if (filters.unloadingLocation) {
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
      relations: { company: true }, // TypeORM 1.x uses object form, not array
    });
    if (!post) {
      throw new NotFoundException(`Cargo post ${id} not found`);
    }
    return post;
  }

  async update(id: string, companyId: string, dto: UpdateCargoPostDto): Promise<CargoPost> {
    const post = await this.findOne(id);
    if (post.companyId !== companyId) {
      throw new ForbiddenException('You can only edit your own posts');
    }
    Object.assign(post, dto);
    return this.cargoPostRepository.save(post);
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
      order: { createdAt: 'DESC' },
    });
  }
}
