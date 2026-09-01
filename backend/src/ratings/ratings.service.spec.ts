import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RatingsService } from './ratings.service';
import { Rating } from './rating.entity';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';
import { UsersService } from '../users/users.service';

type MockRatingRepo = {
  findOne: jest.Mock;
  findOneOrFail: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  createQueryBuilder: jest.Mock;
};
type MockPostRepo = { findOne: jest.Mock };
type MockUsersService = { findById: jest.Mock };

// A fresh chainable query-builder mock for the AVG/COUNT aggregate queries used by
// getSummary()/getSummaries() — same shape as conversations.service.spec.ts's helper,
// trimmed to the methods RatingsService actually calls.
function makeQueryBuilderMock(overrides: Record<string, unknown> = {}) {
  const qb: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ average: null, count: '0' }),
    getRawMany: jest.fn().mockResolvedValue([]),
  };
  Object.assign(qb, overrides);
  return qb;
}

describe('RatingsService', () => {
  let service: RatingsService;
  let ratingRepo: MockRatingRepo;
  let cargoPostRepo: MockPostRepo;
  let vehiclePostRepo: MockPostRepo;
  let usersService: MockUsersService;

  const userOne = 'aaaaaaaa-0000-0000-0000-000000000001';
  const userTwo = 'bbbbbbbb-0000-0000-0000-000000000002';

  function makeRating(overrides: Partial<Rating> = {}) {
    return {
      id: 'rating-1',
      raterId: userOne,
      ratedUserId: userTwo,
      score: 4,
      cargoPostId: null,
      vehiclePostId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Rating;
  }

  beforeEach(() => {
    ratingRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn((r: Partial<Rating>) =>
        Promise.resolve({ id: 'rating-1', ...r }),
      ),
      create: jest.fn((r: unknown) => r),
      createQueryBuilder: jest.fn(() => makeQueryBuilderMock()),
    };
    cargoPostRepo = { findOne: jest.fn() };
    vehiclePostRepo = { findOne: jest.fn() };
    usersService = { findById: jest.fn() };

    service = new RatingsService(
      ratingRepo as unknown as Repository<Rating>,
      cargoPostRepo as unknown as Repository<CargoPost>,
      vehiclePostRepo as unknown as Repository<VehiclePost>,
      usersService as unknown as UsersService,
    );
  });

  describe('submitOrUpdate', () => {
    it('rejects rating yourself without looking up the rated user', async () => {
      await expect(
        service.submitOrUpdate(userOne, { ratedUserId: userOne, score: 5 }),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('rejects an unknown rated user', async () => {
      usersService.findById.mockResolvedValue(null);
      await expect(
        service.submitOrUpdate(userOne, { ratedUserId: userTwo, score: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a new rating on first submission', async () => {
      usersService.findById.mockResolvedValue({ id: userTwo });
      ratingRepo.findOne.mockResolvedValue(null);

      const result = await service.submitOrUpdate(userOne, {
        ratedUserId: userTwo,
        score: 4,
      });

      expect(ratingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          raterId: userOne,
          ratedUserId: userTwo,
          score: 4,
        }),
      );
      expect(result.id).toBe('rating-1');
    });

    it('updates the existing rating instead of creating a duplicate', async () => {
      usersService.findById.mockResolvedValue({ id: userTwo });
      const existing = makeRating({ score: 4 });
      ratingRepo.findOne.mockResolvedValue(existing);

      await service.submitOrUpdate(userOne, {
        ratedUserId: userTwo,
        score: 2,
      });

      expect(ratingRepo.create).not.toHaveBeenCalled();
      expect(ratingRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'rating-1', score: 2 }),
      );
    });

    it('falls back to updating on a unique-constraint race', async () => {
      usersService.findById.mockResolvedValue({ id: userTwo });
      ratingRepo.findOne.mockResolvedValue(null);
      ratingRepo.save
        .mockRejectedValueOnce(new Error('duplicate key value'))
        .mockResolvedValueOnce({ id: 'rating-1', score: 3 });
      ratingRepo.findOneOrFail.mockResolvedValue(makeRating({ score: 4 }));

      const result = await service.submitOrUpdate(userOne, {
        ratedUserId: userTwo,
        score: 3,
      });

      expect(ratingRepo.findOneOrFail).toHaveBeenCalledWith({
        where: { raterId: userOne, ratedUserId: userTwo },
      });
      expect(result.score).toBe(3);
    });

    it('drops a listing id that does not belong to the rated user', async () => {
      usersService.findById.mockResolvedValue({ id: userTwo });
      ratingRepo.findOne.mockResolvedValue(null);
      cargoPostRepo.findOne.mockResolvedValue({
        id: 'post-1',
        company: { userId: 'someone-else' },
      });

      await service.submitOrUpdate(userOne, {
        ratedUserId: userTwo,
        score: 5,
        cargoPostId: 'post-1',
      });

      expect(ratingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ cargoPostId: null }),
      );
    });

    it('attaches a listing id that does belong to the rated user', async () => {
      usersService.findById.mockResolvedValue({ id: userTwo });
      ratingRepo.findOne.mockResolvedValue(null);
      cargoPostRepo.findOne.mockResolvedValue({
        id: 'post-1',
        company: { userId: userTwo },
      });

      await service.submitOrUpdate(userOne, {
        ratedUserId: userTwo,
        score: 5,
        cargoPostId: 'post-1',
      });

      expect(ratingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ cargoPostId: 'post-1' }),
      );
    });
  });

  describe('getSummary', () => {
    it('returns a null average and zero count when there are no ratings', async () => {
      ratingRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilderMock({
          getRawOne: jest.fn().mockResolvedValue({ average: null, count: '0' }),
        }),
      );

      const summary = await service.getSummary(userTwo);
      expect(summary).toEqual({ userId: userTwo, average: null, count: 0 });
    });

    it('returns the exact score for a single rating', async () => {
      ratingRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilderMock({
          getRawOne: jest.fn().mockResolvedValue({ average: '4', count: '1' }),
        }),
      );

      const summary = await service.getSummary(userTwo);
      expect(summary).toEqual({ userId: userTwo, average: 4, count: 1 });
    });

    it('preserves precision for a non-integer average', async () => {
      ratingRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilderMock({
          getRawOne: jest.fn().mockResolvedValue({
            average: '4.3333333333333333',
            count: '3',
          }),
        }),
      );

      const summary = await service.getSummary(userTwo);
      expect(summary.average).toBeCloseTo(13 / 3, 10);
      expect(summary.count).toBe(3);
    });
  });

  describe('getSummaries', () => {
    it('returns one entry per requested id, including ids with zero ratings', async () => {
      ratingRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilderMock({
          getRawMany: jest
            .fn()
            .mockResolvedValue([{ userId: userOne, average: '5', count: '2' }]),
        }),
      );

      const summaries = await service.getSummaries([userOne, userTwo]);

      expect(summaries).toEqual([
        { userId: userOne, average: 5, count: 2 },
        { userId: userTwo, average: null, count: 0 },
      ]);
    });
  });

  describe('getMyRatingFor', () => {
    it('returns null when the rater has never rated that user', async () => {
      ratingRepo.findOne.mockResolvedValue(null);
      const result = await service.getMyRatingFor(userOne, userTwo);
      expect(result).toBeNull();
    });

    it('returns the existing rating otherwise', async () => {
      const existing = makeRating();
      ratingRepo.findOne.mockResolvedValue(existing);
      const result = await service.getMyRatingFor(userOne, userTwo);
      expect(result).toBe(existing);
    });
  });
});
