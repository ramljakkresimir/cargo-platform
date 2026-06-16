import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';
import { PostStatus } from '../common/enums/post-status.enum';

export interface ExpireResult {
  cargoPostsExpired: number;
  vehiclePostsExpired: number;
  message: string;
}

@Injectable()
export class PostsExpirationService {
  private readonly logger = new Logger(PostsExpirationService.name);

  constructor(
    @InjectRepository(CargoPost)
    private readonly cargoPostRepo: Repository<CargoPost>,
    @InjectRepository(VehiclePost)
    private readonly vehiclePostRepo: Repository<VehiclePost>,
  ) {}

  // Runs every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduledExpire() {
    this.logger.log(`Running scheduled post expiration at ${new Date().toISOString()}`);
    const result = await this.expireOldPosts();
    this.logger.log(
      `Expiration complete — cargo: ${result.cargoPostsExpired}, vehicles: ${result.vehiclePostsExpired}`,
    );
  }

  async expireOldPosts(): Promise<ExpireResult> {
    // today in YYYY-MM-DD; posts with date BEFORE today are expired
    const today = new Date().toISOString().split('T')[0];

    const cargoResult = await this.cargoPostRepo
      .createQueryBuilder()
      .update(CargoPost)
      .set({ status: PostStatus.EXPIRED })
      .where('loadingDate < :today', { today })
      .andWhere('status = :status', { status: PostStatus.ACTIVE })
      .execute();

    const vehicleResult = await this.vehiclePostRepo
      .createQueryBuilder()
      .update(VehiclePost)
      .set({ status: PostStatus.EXPIRED })
      .where('availableFromDate < :today', { today })
      .andWhere('status = :status', { status: PostStatus.ACTIVE })
      .execute();

    return {
      cargoPostsExpired: cargoResult.affected ?? 0,
      vehiclePostsExpired: vehicleResult.affected ?? 0,
      message: 'Expired posts updated successfully',
    };
  }
}
