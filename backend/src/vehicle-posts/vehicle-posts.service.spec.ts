import { BadRequestException, ForbiddenException } from '@nestjs/common';

// vehicle-posts.service.ts imports RouteCityService only for its constructor-injected
// type, but @nestjs's emitDecoratorMetadata forces the real module (and its @turf/turf
// import chain, which ships ESM-only deps that ts-jest can't transform) to load at
// runtime unless it's replaced with a lightweight stand-in here.
jest.mock('../routing/route-city.service', () => ({
  RouteCityService: class RouteCityService {},
}));

import { Repository } from 'typeorm';
import { VehiclePostsService } from './vehicle-posts.service';
import { VehiclePost } from './vehicle-post.entity';
import { CitiesService } from '../cities/cities.service';
import { RouteCityService } from '../routing/route-city.service';
import { PostStatus } from '../common/enums/post-status.enum';

type MockRepo = { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
type MockCitiesService = { findById: jest.Mock };
type MockRouteCityService = {
  findByVehiclePostId: jest.Mock;
  generateAndSave: jest.Mock;
};

function localDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

describe('VehiclePostsService', () => {
  let service: VehiclePostsService;
  let repo: MockRepo;
  let citiesService: MockCitiesService;
  let routeCityService: MockRouteCityService;

  const companyId = 'company-1';

  function makePost(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'post-1',
      companyId,
      originCityId: 'city-a',
      destinationCityId: 'city-b',
      originCity: { id: 'city-a', name: 'Mostar', country: 'BA' },
      destinationCity: { id: 'city-b', name: 'Zagreb', country: 'HR' },
      availableFromDate: localDateString(0),
      status: PostStatus.ACTIVE,
      ...overrides,
    };
  }

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn((p: unknown) => Promise.resolve(p)),
      create: jest.fn((p: unknown) => p),
    };
    citiesService = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'city-a', name: 'Mostar', country: 'BA' }),
    };
    routeCityService = {
      findByVehiclePostId: jest.fn().mockResolvedValue([]),
      generateAndSave: jest
        .fn()
        .mockResolvedValue({ routeCities: [], routeCoordinates: null }),
    };
    service = new VehiclePostsService(
      repo as unknown as Repository<VehiclePost>,
      citiesService as unknown as CitiesService,
      routeCityService as unknown as RouteCityService,
    );
  });

  describe('create — past-date guard', () => {
    it('rejects an availableFromDate in the past', async () => {
      await expect(
        service.create(companyId, {
          originCityId: 'city-a',
          availableFromDate: localDateString(-1),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update — ownership', () => {
    it('rejects updates from a different company', async () => {
      repo.findOne.mockResolvedValue(makePost());
      await expect(
        service.update('post-1', 'someone-else', {
          status: PostStatus.CLOSED,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update — owner status transitions (M1)', () => {
    it('rejects setting status directly to expired', async () => {
      repo.findOne.mockResolvedValue(makePost({ status: PostStatus.ACTIVE }));
      await expect(
        service.update('post-1', companyId, {
          status: PostStatus.EXPIRED,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects resurrecting an expired post back to active', async () => {
      repo.findOne.mockResolvedValue(makePost({ status: PostStatus.EXPIRED }));
      await expect(
        service.update('post-1', companyId, {
          status: PostStatus.ACTIVE,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows active -> closed', async () => {
      const post = makePost({ status: PostStatus.ACTIVE });
      repo.findOne.mockResolvedValue(post);

      await service.update('post-1', companyId, {
        status: PostStatus.CLOSED,
      });
      expect(post.status).toBe(PostStatus.CLOSED);
    });

    it('allows closed -> active when the available-from date is still current', async () => {
      const post = makePost({
        status: PostStatus.CLOSED,
        availableFromDate: localDateString(0),
      });
      repo.findOne.mockResolvedValue(post);

      await service.update('post-1', companyId, {
        status: PostStatus.ACTIVE,
      });
      expect(post.status).toBe(PostStatus.ACTIVE);
    });

    it('rejects reactivating a closed post whose available-from date has passed', async () => {
      const post = makePost({
        status: PostStatus.CLOSED,
        availableFromDate: localDateString(-1),
      });
      repo.findOne.mockResolvedValue(post);

      await expect(
        service.update('post-1', companyId, {
          status: PostStatus.ACTIVE,
        } as any),
      ).rejects.toThrow(
        'Cannot reactivate a post with a past available-from date.',
      );
    });
  });
});
