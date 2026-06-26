import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';
import { PostStatus } from '../common/enums/post-status.enum';
import { AdminUsersQueryDto, AdminPostsQueryDto } from './dto/admin-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { RouteCityService } from '../routing/route-city.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CargoPost)
    private readonly cargoPostRepo: Repository<CargoPost>,
    @InjectRepository(VehiclePost)
    private readonly vehiclePostRepo: Repository<VehiclePost>,
    private readonly routeCityService: RouteCityService,
  ) {}

  async getStats() {
    const [totalUsers, totalCargoPosts, totalVehiclePosts, activeCargoPosts, activeVehiclePosts] =
      await Promise.all([
        this.userRepo.count(),
        this.cargoPostRepo.count(),
        this.vehiclePostRepo.count(),
        this.cargoPostRepo.count({ where: { status: PostStatus.ACTIVE } }),
        this.vehiclePostRepo.count({ where: { status: PostStatus.ACTIVE } }),
      ]);

    return {
      totalUsers,
      totalCargoPosts,
      totalVehiclePosts,
      activeCargoPosts,
      activeVehiclePosts,
    };
  }

  // ── Users ──────────────────────────────────────────────────────────

  async getUsers(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC');

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where(
        'user.email ILIKE :term OR user.firstName ILIKE :term OR user.lastName ILIKE :term OR user.phone ILIKE :term',
        { term },
      );
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateUserRole(
    targetId: string,
    dto: UpdateUserRoleDto,
    requestingUserId: string,
  ): Promise<User> {
    const target = await this.userRepo.findOne({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');

    // Guard: prevent an admin from removing their own admin role if they're the last admin
    if (
      targetId === requestingUserId &&
      target.role === UserRole.ADMIN &&
      dto.role === UserRole.USER
    ) {
      const adminCount = await this.userRepo.count({ where: { role: UserRole.ADMIN } });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot remove your own admin role — you are the only admin in the system',
        );
      }
    }

    target.role = dto.role;
    return this.userRepo.save(target);
  }

  async deleteUser(targetId: string, requestingUserId: string): Promise<{ message: string }> {
    if (targetId === requestingUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const target = await this.userRepo.findOne({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');

    // Cascade delete: posts → company → user
    const company = await this.companyRepo.findOne({ where: { userId: targetId } });
    if (company) {
      await this.cargoPostRepo.delete({ companyId: company.id });
      await this.vehiclePostRepo.delete({ companyId: company.id });
      await this.companyRepo.remove(company);
    }

    await this.userRepo.remove(target);
    return { message: 'User deleted successfully' };
  }

  // ── Cargo Posts ────────────────────────────────────────────────────

  async getCargoPosts(query: AdminPostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.cargoPostRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.company', 'company')
      .orderBy('post.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('post.status = :status', { status: query.status });
    }

    if (query.search) {
      const term = `%${query.search}%`;
      qb.andWhere(
        'post.loadingLocation ILIKE :term OR post.unloadingLocation ILIKE :term OR company.companyName ILIKE :term',
        { term },
      );
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateCargoPostStatus(id: string, dto: UpdatePostStatusDto): Promise<CargoPost> {
    const post = await this.cargoPostRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Cargo post not found');
    post.status = dto.status;
    return this.cargoPostRepo.save(post);
  }

  async deleteCargoPost(id: string): Promise<{ message: string }> {
    const post = await this.cargoPostRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Cargo post not found');
    await this.cargoPostRepo.remove(post);
    return { message: 'Cargo post deleted successfully' };
  }

  // ── Vehicle Posts ──────────────────────────────────────────────────

  async getVehiclePosts(query: AdminPostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.vehiclePostRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.company', 'company')
      .orderBy('post.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('post.status = :status', { status: query.status });
    }

    if (query.search) {
      const term = `%${query.search}%`;
      qb.andWhere(
        'post.availableLocation ILIKE :term OR post.destinationPreference ILIKE :term OR company.companyName ILIKE :term',
        { term },
      );
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateVehiclePostStatus(id: string, dto: UpdatePostStatusDto): Promise<VehiclePost> {
    const post = await this.vehiclePostRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Vehicle post not found');
    post.status = dto.status;
    return this.vehiclePostRepo.save(post);
  }

  async deleteVehiclePost(id: string): Promise<{ message: string }> {
    const post = await this.vehiclePostRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Vehicle post not found');
    await this.vehiclePostRepo.remove(post);
    return { message: 'Vehicle post deleted successfully' };
  }

  async regenerateRouteCities(id: string): Promise<{ message: string; routeCitiesCount: number }> {
    const post = await this.vehiclePostRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Vehicle post not found');
    if (!post.originCityId) {
      throw new BadRequestException('Vehicle post has no origin city — cannot generate route');
    }

    const originCity = await this.routeCityService.findCityById(post.originCityId);
    if (!originCity) throw new BadRequestException('Origin city record not found');

    const destCity = post.destinationCityId
      ? await this.routeCityService.findCityById(post.destinationCityId)
      : null;

    const saved = await this.routeCityService.generateAndSave(id, originCity, destCity);
    return { message: 'Route cities regenerated successfully', routeCitiesCount: saved.length };
  }
}
