import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConversationsService } from './conversations.service';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';
import { UsersService } from '../users/users.service';

type MockConversationRepo = {
  findOne: jest.Mock;
  findOneOrFail: jest.Mock;
  find: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  createQueryBuilder: jest.Mock;
};
type MockMessageRepo = {
  find: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  createQueryBuilder: jest.Mock;
};
type MockPostRepo = { findOne: jest.Mock };
type MockUsersService = { findById: jest.Mock };

// A fresh chainable query-builder mock — every builder method used across
// ConversationsService (distinctOn/groupBy aggregation for list(), the raw update in
// getMessages(), the innerJoin count in getUnreadCount()) resolves to an empty/zero
// default unless a test overrides it.
function makeQueryBuilderMock(overrides: Record<string, unknown> = {}) {
  const qb: Record<string, jest.Mock> = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    distinctOn: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    execute: jest.fn().mockResolvedValue({ affected: 0 }),
  };
  Object.assign(qb, overrides);
  return qb;
}

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationRepo: MockConversationRepo;
  let messageRepo: MockMessageRepo;
  let cargoPostRepo: MockPostRepo;
  let vehiclePostRepo: MockPostRepo;
  let usersService: MockUsersService;

  const userOne = 'aaaaaaaa-0000-0000-0000-000000000001';
  const userTwo = 'bbbbbbbb-0000-0000-0000-000000000002';

  function makeConversation(overrides: Partial<Conversation> = {}) {
    return {
      id: 'conv-1',
      userAId: userOne,
      userBId: userTwo,
      cargoPostId: null,
      vehiclePostId: null,
      lastMessageAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Conversation;
  }

  beforeEach(() => {
    conversationRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((c: Partial<Conversation>) =>
        Promise.resolve({ id: 'conv-1', ...c }),
      ),
      create: jest.fn((c: unknown) => c),
      createQueryBuilder: jest.fn(() => makeQueryBuilderMock()),
    };
    messageRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((m: unknown) =>
        Promise.resolve({
          ...(m as object),
          id: 'msg-1',
          createdAt: new Date(),
        }),
      ),
      create: jest.fn((m: unknown) => m),
      createQueryBuilder: jest.fn(() => makeQueryBuilderMock()),
    };
    cargoPostRepo = { findOne: jest.fn() };
    vehiclePostRepo = { findOne: jest.fn() };
    usersService = { findById: jest.fn() };

    service = new ConversationsService(
      conversationRepo as unknown as Repository<Conversation>,
      messageRepo as unknown as Repository<Message>,
      cargoPostRepo as unknown as Repository<CargoPost>,
      vehiclePostRepo as unknown as Repository<VehiclePost>,
      usersService as unknown as UsersService,
    );
  });

  describe('startOrGet', () => {
    it('rejects messaging yourself without looking up a recipient', async () => {
      await expect(
        service.startOrGet(userOne, { recipientUserId: userOne }),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('rejects an unknown recipient', async () => {
      usersService.findById.mockResolvedValue(null);
      await expect(
        service.startOrGet(userOne, { recipientUserId: userTwo }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a new conversation with a canonically sorted user pair regardless of who initiates', async () => {
      usersService.findById.mockResolvedValue({ id: userTwo });
      conversationRepo.findOne.mockResolvedValue(null);
      conversationRepo.find.mockResolvedValue([
        makeConversation({
          userA: {
            id: userTwo,
            firstName: 'B',
            lastName: 'User',
            company: null,
          },
          userB: {
            id: userOne,
            firstName: 'A',
            lastName: 'User',
            company: null,
          },
        } as never),
      ]);

      // userTwo initiates contact with userOne — userOne < userTwo lexicographically,
      // so the canonical pair must still be (userOne, userTwo).
      await service.startOrGet(userTwo, { recipientUserId: userOne });

      expect(conversationRepo.findOne).toHaveBeenCalledWith({
        where: { userAId: userOne, userBId: userTwo },
      });
      expect(conversationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userAId: userOne, userBId: userTwo }),
      );
    });

    it('reuses an existing conversation instead of creating a duplicate', async () => {
      usersService.findById.mockResolvedValue({ id: userTwo });
      const existing = makeConversation({
        userA: { id: userOne, firstName: 'A', lastName: 'User', company: null },
        userB: { id: userTwo, firstName: 'B', lastName: 'User', company: null },
      } as never);
      conversationRepo.findOne.mockResolvedValue(existing);

      const result = await service.startOrGet(userOne, {
        recipientUserId: userTwo,
      });

      expect(conversationRepo.create).not.toHaveBeenCalled();
      expect(result.id).toBe('conv-1');
    });
  });

  describe('getMessages', () => {
    it('throws NotFoundException for a nonexistent conversation', async () => {
      conversationRepo.findOne.mockResolvedValue(null);
      await expect(service.getMessages('conv-1', userOne)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for a user who is not a participant', async () => {
      conversationRepo.findOne.mockResolvedValue(makeConversation());
      await expect(
        service.getMessages('conv-1', 'someone-else'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns the message history for a participant', async () => {
      conversationRepo.findOne.mockResolvedValue(makeConversation());
      messageRepo.find.mockResolvedValue([{ id: 'msg-1', content: 'hi' }]);

      const messages = await service.getMessages('conv-1', userOne);
      expect(messages).toHaveLength(1);
    });
  });

  describe('sendMessage', () => {
    it('rejects a whitespace-only message', async () => {
      conversationRepo.findOne.mockResolvedValue(makeConversation());
      await expect(
        service.sendMessage('conv-1', userOne, { content: '   ' }),
      ).rejects.toThrow(BadRequestException);
      expect(messageRepo.save).not.toHaveBeenCalled();
    });

    it('rejects a sender who is not a participant', async () => {
      conversationRepo.findOne.mockResolvedValue(makeConversation());
      await expect(
        service.sendMessage('conv-1', 'someone-else', { content: 'hi' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('saves the message and bumps the conversation lastMessageAt', async () => {
      const conversation = makeConversation();
      conversationRepo.findOne.mockResolvedValue(conversation);

      const message = await service.sendMessage('conv-1', userOne, {
        content: '  Zdravo, ima li mjesta za utovar?  ',
      });

      expect(message.content).toBe('Zdravo, ima li mjesta za utovar?');
      expect(conversationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ lastMessageAt: expect.any(Date) as Date }),
      );
    });
  });
});
