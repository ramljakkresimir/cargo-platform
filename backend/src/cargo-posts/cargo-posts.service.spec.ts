import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CargoPostsService } from './cargo-posts.service';
import { CargoPost } from './cargo-post.entity';
import { CitiesService } from '../cities/cities.service';
import { RoutingService } from '../routing/routing.service';
import { PostStatus } from '../common/enums/post-status.enum';

type MockRepo = {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};
type MockCitiesService = { findById: jest.Mock };
type MockRoutingService = { getRoute: jest.Mock };

function localDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

describe('CargoPostsService', () => {
  let service: CargoPostsService;
  let repo: MockRepo;
  let citiesService: MockCitiesService;
  let routingService: MockRoutingService;

  const companyId = 'company-1';

  function makePost(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'post-1',
      companyId,
      loadingCityId: 'city-a',
      unloadingCityId: 'city-b',
      loadingDate: localDateString(0),
      status: PostStatus.ACTIVE,
      ...overrides,
    };
  }

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn((p: unknown) => Promise.resolve(p)),
      create: jest.fn((p: unknown) => p),
      update: jest.fn(),
    };
    citiesService = {
      findById: jest.fn().mockResolvedValue({
        id: 'city-a',
        name: 'Sarajevo',
        country: 'BA',
        latitude: 43.8563,
        longitude: 18.4131,
      }),
    };
    routingService = { getRoute: jest.fn().mockResolvedValue(null) };
    service = new CargoPostsService(
      repo as unknown as Repository<CargoPost>,
      citiesService as unknown as CitiesService,
      routingService as unknown as RoutingService,
    );
  });

  describe('create — past-date guard', () => {
    it('rejects a loadingDate in the past', async () => {
      await expect(
        service.create(companyId, {
          loadingCityId: 'city-a',
          unloadingCityId: 'city-b',
          loadingDate: localDateString(-1),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts a loadingDate of today', async () => {
      repo.findOne.mockResolvedValue(makePost());
      await expect(
        service.create(companyId, {
          loadingCityId: 'city-a',
          unloadingCityId: 'city-b',
          loadingDate: localDateString(0),
        } as any),
      ).resolves.toBeDefined();
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

    it('allows closed -> active when the loading date is still current', async () => {
      const post = makePost({
        status: PostStatus.CLOSED,
        loadingDate: localDateString(0),
      });
      repo.findOne.mockResolvedValue(post);

      await service.update('post-1', companyId, {
        status: PostStatus.ACTIVE,
      });
      expect(post.status).toBe(PostStatus.ACTIVE);
    });

    it('rejects reactivating a closed post whose loading date has passed', async () => {
      const post = makePost({
        status: PostStatus.CLOSED,
        loadingDate: localDateString(-1),
      });
      repo.findOne.mockResolvedValue(post);

      await expect(
        service.update('post-1', companyId, {
          status: PostStatus.ACTIVE,
        } as any),
      ).rejects.toThrow('Cannot reactivate a post with a past loading date.');
    });
  });
});
