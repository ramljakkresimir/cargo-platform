import { BadRequestException, ForbiddenException } from '@nestjs/common';

// AdminService imports RouteCityService only for its constructor-injected type; avoid
// pulling in the real module's @turf/turf import chain (see vehicle-posts.service.spec.ts).
jest.mock('../routing/route-city.service', () => ({
  RouteCityService: class RouteCityService {},
}));

import { AdminService } from './admin.service';
import { UserRole } from '../users/user.entity';

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: any;
  let companyRepo: any;
  let cargoPostRepo: any;
  let vehiclePostRepo: any;
  let routeCityService: any;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn((u: unknown) => Promise.resolve(u)),
      manager: {
        transaction: jest.fn(async (cb: (manager: any) => Promise<void>) => {
          const manager = {
            findOne: jest.fn().mockResolvedValue(null),
            delete: jest.fn(),
            remove: jest.fn(),
          };
          await cb(manager);
          return manager;
        }),
      },
    };
    companyRepo = {};
    cargoPostRepo = {};
    vehiclePostRepo = {};
    routeCityService = {};
    service = new AdminService(userRepo, companyRepo, cargoPostRepo, vehiclePostRepo, routeCityService);
  });

  describe('deleteUser — self-delete guard', () => {
    it('rejects an admin deleting their own account', async () => {
      await expect(service.deleteUser('user-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('allows deleting a different user and runs the cascade inside a transaction', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-2' });

      const result = await service.deleteUser('user-2', 'user-1');

      expect(result.message).toMatch(/deleted/i);
      expect(userRepo.manager.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateUserRole — last-admin guard', () => {
    it('rejects an admin removing their own admin role if they are the only admin', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });
      userRepo.count.mockResolvedValue(1);

      await expect(
        service.updateUserRole('admin-1', { role: UserRole.USER } as any, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows an admin removing their own admin role if another admin exists', async () => {
      const target = { id: 'admin-1', role: UserRole.ADMIN };
      userRepo.findOne.mockResolvedValue(target);
      userRepo.count.mockResolvedValue(2);

      await service.updateUserRole('admin-1', { role: UserRole.USER } as any, 'admin-1');
      expect(target.role).toBe(UserRole.USER);
    });

    it('allows demoting a different admin without checking the last-admin count', async () => {
      const target = { id: 'admin-2', role: UserRole.ADMIN };
      userRepo.findOne.mockResolvedValue(target);

      await service.updateUserRole('admin-2', { role: UserRole.USER } as any, 'admin-1');
      expect(target.role).toBe(UserRole.USER);
      expect(userRepo.count).not.toHaveBeenCalled();
    });
  });
});
