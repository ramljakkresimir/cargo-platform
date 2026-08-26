import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

// AdminService imports RouteCityService only for its constructor-injected type; avoid
// pulling in the real module's @turf/turf import chain (see vehicle-posts.service.spec.ts).
jest.mock('../routing/route-city.service', () => ({
  RouteCityService: class RouteCityService {},
}));

import { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { User, UserRole } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';
import { RouteCityService } from '../routing/route-city.service';
import { CompaniesService } from '../companies/companies.service';
import { PostStatus } from '../common/enums/post-status.enum';
import { Conversation } from '../messaging/conversation.entity';

type MockTransactionManager = {
  findOne: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
  createQueryBuilder: jest.Mock;
};
type MockUserRepo = {
  findOne: jest.Mock;
  count: jest.Mock;
  save: jest.Mock;
  manager: { transaction: jest.Mock };
};
type MockPostRepo = {
  count: jest.Mock;
  createQueryBuilder: jest.Mock;
};
type MockCompaniesService = {
  findByUserId: jest.Mock;
  updateByUserId: jest.Mock;
};

function makeUpdateQueryBuilderMock(affected: number) {
  return {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected }),
  };
}

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: MockUserRepo;
  let companyRepo: object;
  let cargoPostRepo: MockPostRepo;
  let vehiclePostRepo: MockPostRepo;
  let routeCityService: object;
  let companiesService: MockCompaniesService;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn((u: unknown) => Promise.resolve(u)),
      manager: {
        transaction: jest.fn(
          async (cb: (manager: MockTransactionManager) => Promise<void>) => {
            const manager: MockTransactionManager = {
              findOne: jest.fn().mockResolvedValue(null),
              delete: jest.fn(),
              remove: jest.fn(),
              createQueryBuilder: jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ affected: 0 }),
              }),
            };
            await cb(manager);
            return manager;
          },
        ),
      },
    };
    companyRepo = {};
    cargoPostRepo = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(makeUpdateQueryBuilderMock(0)),
    };
    vehiclePostRepo = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(makeUpdateQueryBuilderMock(0)),
    };
    routeCityService = {};
    companiesService = {
      findByUserId: jest.fn(),
      updateByUserId: jest.fn(),
    };
    service = new AdminService(
      userRepo as unknown as Repository<User>,
      companyRepo as unknown as Repository<Company>,
      cargoPostRepo as unknown as Repository<CargoPost>,
      vehiclePostRepo as unknown as Repository<VehiclePost>,
      routeCityService as unknown as RouteCityService,
      companiesService as unknown as CompaniesService,
    );
  });

  describe('deleteUser — self-delete guard', () => {
    it('rejects an admin deleting their own account', async () => {
      await expect(service.deleteUser('user-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows deleting a different user and runs the cascade inside a transaction', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-2' });

      const result = await service.deleteUser('user-2', 'user-1');

      expect(result.message).toMatch(/deleted/i);
      expect(userRepo.manager.transaction).toHaveBeenCalledTimes(1);
    });

    it("deletes the user's conversations before removing the user, so the userAId/userBId FK (ON DELETE NO ACTION) never blocks the delete", async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-2' });
      let conversationsDeletedBeforeUser = false;
      const deleteBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockImplementation(() => {
          conversationsDeletedBeforeUser = true;
          return Promise.resolve({ affected: 2 });
        }),
      };
      userRepo.manager.transaction.mockImplementationOnce(
        async (cb: (manager: MockTransactionManager) => Promise<void>) => {
          const manager: MockTransactionManager = {
            findOne: jest.fn().mockResolvedValue(null),
            delete: jest.fn(),
            remove: jest.fn().mockImplementation(() => {
              expect(conversationsDeletedBeforeUser).toBe(true);
              return Promise.resolve();
            }),
            createQueryBuilder: jest.fn().mockReturnValue(deleteBuilder),
          };
          await cb(manager);
          return manager;
        },
      );

      await service.deleteUser('user-2', 'user-1');

      expect(deleteBuilder.from).toHaveBeenCalledWith(Conversation);
    });
  });

  describe('updateUserRole — last-admin guard', () => {
    it('rejects an admin removing their own admin role if they are the only admin', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'admin-1',
        role: UserRole.ADMIN,
      });
      userRepo.count.mockResolvedValue(1);

      await expect(
        service.updateUserRole(
          'admin-1',
          { role: UserRole.USER } as any,
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows an admin removing their own admin role if another admin exists', async () => {
      const target = { id: 'admin-1', role: UserRole.ADMIN };
      userRepo.findOne.mockResolvedValue(target);
      userRepo.count.mockResolvedValue(2);

      await service.updateUserRole(
        'admin-1',
        { role: UserRole.USER },
        'admin-1',
      );
      expect(target.role).toBe(UserRole.USER);
    });

    it('allows demoting a different admin without checking the last-admin count', async () => {
      const target = { id: 'admin-2', role: UserRole.ADMIN };
      userRepo.findOne.mockResolvedValue(target);

      await service.updateUserRole(
        'admin-2',
        { role: UserRole.USER },
        'admin-1',
      );
      expect(target.role).toBe(UserRole.USER);
      expect(userRepo.count).not.toHaveBeenCalled();
    });
  });

  describe('getUserCompany / updateUserCompany', () => {
    it('rejects with 404 when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getUserCompany('missing-user')).rejects.toThrow(
        NotFoundException,
      );
      expect(companiesService.findByUserId).not.toHaveBeenCalled();
    });

    it('returns the company profile for an existing user by delegating to CompaniesService', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-1' });
      const company = {
        id: 'company-1',
        userId: 'user-1',
        companyName: 'Acme',
      };
      companiesService.findByUserId.mockResolvedValue(company);

      const result = await service.getUserCompany('user-1');

      expect(result).toBe(company);
      expect(companiesService.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('propagates a 404 from CompaniesService when the user has no company profile', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-1' });
      companiesService.findByUserId.mockRejectedValue(
        new NotFoundException('Company profile not found.'),
      );

      await expect(service.getUserCompany('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects updating a company profile when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateUserCompany('missing-user', { companyName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
      expect(companiesService.updateByUserId).not.toHaveBeenCalled();
    });

    it('updates allowed fields by delegating to CompaniesService (same validation as /companies/me)', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-1' });
      const updated = {
        id: 'company-1',
        userId: 'user-1',
        companyName: 'New Name',
      };
      companiesService.updateByUserId.mockResolvedValue(updated);

      const result = await service.updateUserCompany('user-1', {
        companyName: 'New Name',
      });

      expect(result).toBe(updated);
      expect(companiesService.updateByUserId).toHaveBeenCalledWith('user-1', {
        companyName: 'New Name',
      });
    });
  });

  describe('closeExpiredPosts — bulk admin action', () => {
    it('bulk-updates only expired posts to closed, for both cargo and vehicle posts', async () => {
      const cargoQb = makeUpdateQueryBuilderMock(3);
      const vehicleQb = makeUpdateQueryBuilderMock(2);
      cargoPostRepo.createQueryBuilder.mockReturnValue(cargoQb);
      vehiclePostRepo.createQueryBuilder.mockReturnValue(vehicleQb);

      const result = await service.closeExpiredPosts();

      expect(cargoQb.set).toHaveBeenCalledWith({ status: PostStatus.CLOSED });
      expect(cargoQb.where).toHaveBeenCalledWith('status = :status', {
        status: PostStatus.EXPIRED,
      });
      expect(vehicleQb.set).toHaveBeenCalledWith({ status: PostStatus.CLOSED });
      expect(vehicleQb.where).toHaveBeenCalledWith('status = :status', {
        status: PostStatus.EXPIRED,
      });
      expect(result).toEqual({
        cargoPostsClosed: 3,
        vehiclePostsClosed: 2,
        totalClosed: 5,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message: expect.any(String),
      });
    });

    it('is idempotent — a second run with nothing expired affects zero rows', async () => {
      cargoPostRepo.createQueryBuilder.mockReturnValue(
        makeUpdateQueryBuilderMock(0),
      );
      vehiclePostRepo.createQueryBuilder.mockReturnValue(
        makeUpdateQueryBuilderMock(0),
      );

      const result = await service.closeExpiredPosts();

      expect(result.totalClosed).toBe(0);
    });
  });

  describe('countExpiredPosts', () => {
    it('returns counts of expired cargo and vehicle posts', async () => {
      cargoPostRepo.count.mockResolvedValue(3);
      vehiclePostRepo.count.mockResolvedValue(2);

      const result = await service.countExpiredPosts();

      expect(cargoPostRepo.count).toHaveBeenCalledWith({
        where: { status: PostStatus.EXPIRED },
      });
      expect(vehiclePostRepo.count).toHaveBeenCalledWith({
        where: { status: PostStatus.EXPIRED },
      });
      expect(result).toEqual({
        cargoPostsExpired: 3,
        vehiclePostsExpired: 2,
        total: 5,
      });
    });
  });
});
