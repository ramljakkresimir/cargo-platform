import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';
import { UsersService } from '../users/users.service';
import { RateUserDto } from './dto/rate-user.dto';

export interface RatingSummary {
  userId: string;
  average: number | null;
  count: number;
}

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    @InjectRepository(CargoPost)
    private readonly cargoPostRepo: Repository<CargoPost>,
    @InjectRepository(VehiclePost)
    private readonly vehiclePostRepo: Repository<VehiclePost>,
    private readonly usersService: UsersService,
  ) {}

  // Best-effort listing context: only attach it when it genuinely belongs to the
  // rated user. A stale/mismatched/deleted id is silently dropped rather than failing
  // the whole request — same pattern as ConversationsService.startOrGet().
  private async resolveListingContext(
    ratedUserId: string,
    dto: RateUserDto,
  ): Promise<{ cargoPostId: string | null; vehiclePostId: string | null }> {
    let cargoPostId: string | null = null;
    let vehiclePostId: string | null = null;

    if (dto.cargoPostId) {
      const post = await this.cargoPostRepo.findOne({
        where: { id: dto.cargoPostId },
        relations: { company: true },
      });
      if (post?.company?.userId === ratedUserId) {
        cargoPostId = post.id;
      }
    } else if (dto.vehiclePostId) {
      const post = await this.vehiclePostRepo.findOne({
        where: { id: dto.vehiclePostId },
        relations: { company: true },
      });
      if (post?.company?.userId === ratedUserId) {
        vehiclePostId = post.id;
      }
    }

    return { cargoPostId, vehiclePostId };
  }

  async submitOrUpdate(raterId: string, dto: RateUserDto): Promise<Rating> {
    if (dto.ratedUserId === raterId) {
      throw new BadRequestException('Ne možete ocijeniti sami sebe.');
    }

    const ratedUser = await this.usersService.findById(dto.ratedUserId);
    if (!ratedUser) {
      throw new NotFoundException('Korisnik nije pronađen.');
    }

    const { cargoPostId, vehiclePostId } = await this.resolveListingContext(
      dto.ratedUserId,
      dto,
    );

    let rating = await this.ratingRepo.findOne({
      where: { raterId, ratedUserId: dto.ratedUserId },
    });

    if (!rating) {
      try {
        rating = await this.ratingRepo.save(
          this.ratingRepo.create({
            raterId,
            ratedUserId: dto.ratedUserId,
            score: dto.score,
            cargoPostId,
            vehiclePostId,
          }),
        );
      } catch {
        // Unique constraint race — a concurrent request already created this pair's
        // rating (same pattern as ConversationsService.startOrGet() /
        // CityDistanceService.resolveOne()). Fall back to updating the row instead.
        rating = await this.ratingRepo.findOneOrFail({
          where: { raterId, ratedUserId: dto.ratedUserId },
        });
        rating.score = dto.score;
        rating = await this.ratingRepo.save(rating);
      }
    } else {
      // Rating the same person again updates the existing row rather than creating a
      // new one. Listing context is only attached if the existing rating has none yet
      // — same "attach only if empty" rule as Conversation's context field.
      rating.score = dto.score;
      if (!rating.cargoPostId && !rating.vehiclePostId) {
        rating.cargoPostId = cargoPostId;
        rating.vehiclePostId = vehiclePostId;
      }
      rating = await this.ratingRepo.save(rating);
    }

    return rating;
  }

  async getSummary(userId: string): Promise<RatingSummary> {
    const raw = await this.ratingRepo
      .createQueryBuilder('r')
      .select('AVG(r.score)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('r.ratedUserId = :userId', { userId })
      .getRawOne<{ average: string | null; count: string }>();

    const count = Number(raw?.count ?? 0);
    return {
      userId,
      average: count > 0 && raw?.average != null ? Number(raw.average) : null,
      count,
    };
  }

  async getSummaries(userIds: string[]): Promise<RatingSummary[]> {
    const rows = await this.ratingRepo
      .createQueryBuilder('r')
      .select('r.ratedUserId', 'userId')
      .addSelect('AVG(r.score)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('r.ratedUserId IN (:...userIds)', { userIds })
      .groupBy('r.ratedUserId')
      .getRawMany<{ userId: string; average: string; count: string }>();

    const byId = new Map(
      rows.map((r) => [
        r.userId,
        {
          userId: r.userId,
          average: Number(r.average),
          count: Number(r.count),
        },
      ]),
    );

    // Always return one entry per requested id, even when a user has zero ratings —
    // same contract as CityDistanceService.getDistances() always returning one result
    // per requested pair.
    return userIds.map(
      (userId) => byId.get(userId) ?? { userId, average: null, count: 0 },
    );
  }

  async getMyRatingFor(
    raterId: string,
    ratedUserId: string,
  ): Promise<Rating | null> {
    return this.ratingRepo.findOne({ where: { raterId, ratedUserId } });
  }
}
