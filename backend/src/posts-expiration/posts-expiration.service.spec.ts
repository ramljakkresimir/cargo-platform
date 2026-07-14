import { PostsExpirationService } from './posts-expiration.service';
import { PostStatus } from '../common/enums/post-status.enum';

function makeQueryBuilderMock(affected: number) {
  const qb: any = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected }),
  };
  return qb;
}

describe('PostsExpirationService', () => {
  let service: PostsExpirationService;
  let cargoQb: ReturnType<typeof makeQueryBuilderMock>;
  let vehicleQb: ReturnType<typeof makeQueryBuilderMock>;
  let cargoRepo: any;
  let vehicleRepo: any;

  beforeEach(() => {
    cargoQb = makeQueryBuilderMock(2);
    vehicleQb = makeQueryBuilderMock(4);
    cargoRepo = { createQueryBuilder: jest.fn().mockReturnValue(cargoQb) };
    vehicleRepo = { createQueryBuilder: jest.fn().mockReturnValue(vehicleQb) };
    service = new PostsExpirationService(cargoRepo, vehicleRepo);
  });

  it('compares against the local calendar date, not UTC (Session 13 regression)', async () => {
    // Pin "now" to a moment where UTC and local date would disagree if toISOString()
    // were used: 2026-07-14T23:30 in UTC+2 is 2026-07-14 local, but 2026-07-14 UTC is
    // still "today" too — pick a time near local midnight instead so a UTC-based bug
    // would compute yesterday's date.
    const fixedLocal = new Date(2026, 6, 14, 0, 30, 0); // July 14, 2026, 00:30 local time
    jest.useFakeTimers().setSystemTime(fixedLocal);

    await service.expireOldPosts();

    expect(cargoQb.where).toHaveBeenCalledWith('loadingDate < :today', { today: '2026-07-14' });
    expect(vehicleQb.where).toHaveBeenCalledWith('availableFromDate < :today', {
      today: '2026-07-14',
    });

    jest.useRealTimers();
  });

  it('only targets active posts', async () => {
    await service.expireOldPosts();

    expect(cargoQb.andWhere).toHaveBeenCalledWith('status = :status', {
      status: PostStatus.ACTIVE,
    });
    expect(vehicleQb.andWhere).toHaveBeenCalledWith('status = :status', {
      status: PostStatus.ACTIVE,
    });
    expect(cargoQb.set).toHaveBeenCalledWith({ status: PostStatus.EXPIRED });
    expect(vehicleQb.set).toHaveBeenCalledWith({ status: PostStatus.EXPIRED });
  });

  it('returns the affected counts from both updates', async () => {
    const result = await service.expireOldPosts();
    expect(result).toEqual({
      cargoPostsExpired: 2,
      vehiclePostsExpired: 4,
      message: expect.any(String),
    });
  });

  it('runs the same expiration once at startup (onApplicationBootstrap)', async () => {
    const spy = jest.spyOn(service, 'expireOldPosts');
    await service.onApplicationBootstrap();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
