import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehiclePost } from './vehicle-post.entity';
import { PostStatus } from '../common/enums/post-status.enum';
import { CreateVehiclePostDto } from './dto/create-vehicle-post.dto';
import { UpdateVehiclePostDto } from './dto/update-vehicle-post.dto';
import { FilterVehiclePostsDto } from './dto/filter-vehicle-posts.dto';

@Injectable()
export class VehiclePostsService {
  constructor(
    @InjectRepository(VehiclePost)
    private readonly vehiclePostRepository: Repository<VehiclePost>,
  ) {}

  async create(companyId: string, dto: CreateVehiclePostDto): Promise<VehiclePost> {
    const post = this.vehiclePostRepository.create({ ...dto, companyId });
    return this.vehiclePostRepository.save(post);
  }

  async findAll(filters: FilterVehiclePostsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const query = this.vehiclePostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.company', 'company')
      .where('post.status = :status', { status: PostStatus.ACTIVE })
      .orderBy('post.createdAt', 'DESC');

    if (filters.availableLocation) {
      query.andWhere('post.availableLocation ILIKE :al', {
        al: `%${filters.availableLocation}%`,
      });
    }
    if (filters.availableFromDate) {
      query.andWhere('post.availableFromDate = :afd', {
        afd: filters.availableFromDate,
      });
    }
    if (filters.vehicleType) {
      query.andWhere('post.vehicleType ILIKE :vt', { vt: filters.vehicleType });
    }
    if (filters.destinationPreference) {
      query.andWhere('post.destinationPreference ILIKE :dp', {
        dp: `%${filters.destinationPreference}%`,
      });
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
      relations: { company: true }, // TypeORM 1.x uses object form, not array
    });
    if (!post) {
      throw new NotFoundException(`Vehicle post ${id} not found`);
    }
    return post;
  }

  async update(id: string, companyId: string, dto: UpdateVehiclePostDto): Promise<VehiclePost> {
    const post = await this.findOne(id);
    if (post.companyId !== companyId) {
      throw new ForbiddenException('You can only edit your own posts');
    }
    Object.assign(post, dto);
    return this.vehiclePostRepository.save(post);
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
    return this.vehiclePostRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }
}
