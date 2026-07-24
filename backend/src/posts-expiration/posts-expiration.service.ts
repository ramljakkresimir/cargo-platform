import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
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
export class PostsExpirationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PostsExpirationService.name);

  constructor(
    @InjectRepository(CargoPost)
    private readonly cargoPostRepo: Repository<CargoPost>,
    @InjectRepository(VehiclePost)
    private readonly vehiclePostRepo: Repository<VehiclePost>,
  ) {}

  // The cron only fires at wall-clock midnight, so any active/past-dated posts that
  // accumulated while the server was stopped (common in dev, where the backend is
  // restarted often) stay unexpired until the next midnight tick or a manual admin
  // trigger. Running the same expiration query once at startup keeps the DB in sync
  // with reality as soon as the app comes up, with no duplicated logic.
  async onApplicationBootstrap() {
    this.logger.log('Running startup post-expiration sync');
    await this.expireOldPosts();
  }

  // Runs every day at midnight (server local time)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduledExpire() {
    this.logger.log('Scheduled post expiration triggered');
    await this.expireOldPosts();
  }

  async expireOldPosts(): Promise<ExpireResult> {
    // Use local date components, not toISOString() which returns UTC.
    // If the server runs in CET (UTC+2), midnight CET = 22:00 UTC the previous day —
    // toISOString() would give yesterday's date and miss posts that should expire today.
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    this.logger.log(
      `Expiring active posts with date before: ${today} (local date)`,
    );

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

    const result: ExpireResult = {
      cargoPostsExpired: cargoResult.affected ?? 0,
      vehiclePostsExpired: vehicleResult.affected ?? 0,
      message: 'Expired posts updated successfully',
    };

    this.logger.log(
      `Expiration complete — today: ${today}, cargo expired: ${result.cargoPostsExpired}, vehicles expired: ${result.vehiclePostsExpired}`,
    );

    return result;
  }
}
