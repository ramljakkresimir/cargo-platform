import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';
import { UsersService } from '../users/users.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

export interface OtherUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
}

export interface ConversationSummary {
  id: string;
  otherUser: OtherUserSummary;
  listingType: 'cargo' | 'vehicle' | null;
  cargoPostId: string | null;
  vehiclePostId: string | null;
  lastMessage: { content: string; senderId: string; createdAt: Date } | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(CargoPost)
    private readonly cargoPostRepo: Repository<CargoPost>,
    @InjectRepository(VehiclePost)
    private readonly vehiclePostRepo: Repository<VehiclePost>,
    private readonly usersService: UsersService,
  ) {}

  private canonicalPair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  private assertParticipant(conversation: Conversation, userId: string) {
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException('You are not part of this conversation.');
    }
  }

  async startOrGet(
    currentUserId: string,
    dto: StartConversationDto,
  ): Promise<ConversationSummary> {
    if (dto.recipientUserId === currentUserId) {
      throw new BadRequestException(
        'Ne možete pokrenuti razgovor sa samim sobom.',
      );
    }

    const recipient = await this.usersService.findById(dto.recipientUserId);
    if (!recipient) {
      throw new NotFoundException('Korisnik nije pronađen.');
    }

    // Best-effort listing context: only attach it when it genuinely belongs to the
    // recipient. A stale/mismatched/deleted id is silently dropped rather than
    // failing the whole request — the point is still to reach the listing's owner.
    let cargoPostId: string | null = null;
    let vehiclePostId: string | null = null;
    if (dto.cargoPostId) {
      const post = await this.cargoPostRepo.findOne({
        where: { id: dto.cargoPostId },
        relations: { company: true },
      });
      if (post?.company?.userId === dto.recipientUserId) {
        cargoPostId = post.id;
      }
    } else if (dto.vehiclePostId) {
      const post = await this.vehiclePostRepo.findOne({
        where: { id: dto.vehiclePostId },
        relations: { company: true },
      });
      if (post?.company?.userId === dto.recipientUserId) {
        vehiclePostId = post.id;
      }
    }

    const [userAId, userBId] = this.canonicalPair(
      currentUserId,
      dto.recipientUserId,
    );

    let conversation = await this.conversationRepo.findOne({
      where: { userAId, userBId },
    });

    if (!conversation) {
      try {
        conversation = await this.conversationRepo.save(
          this.conversationRepo.create({
            userAId,
            userBId,
            cargoPostId,
            vehiclePostId,
          }),
        );
      } catch {
        // Unique constraint race — a concurrent request already created this pair's
        // conversation (same pattern as CityDistanceService.resolveOne()).
        conversation = await this.conversationRepo.findOneOrFail({
          where: { userAId, userBId },
        });
      }
    } else if (!conversation.cargoPostId && !conversation.vehiclePostId) {
      // Existing thread with no listing context yet — attach this one for display,
      // without overwriting whatever context it may already carry.
      conversation.cargoPostId = cargoPostId;
      conversation.vehiclePostId = vehiclePostId;
      if (cargoPostId || vehiclePostId) {
        conversation = await this.conversationRepo.save(conversation);
      }
    }

    const [summary] = await this.toSummaries([conversation], currentUserId);
    return summary;
  }

  async list(currentUserId: string): Promise<ConversationSummary[]> {
    const conversations = await this.conversationRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.userA', 'userA')
      .leftJoinAndSelect('userA.company', 'userACompany')
      .leftJoinAndSelect('c.userB', 'userB')
      .leftJoinAndSelect('userB.company', 'userBCompany')
      .where('c.userAId = :userId OR c.userBId = :userId', {
        userId: currentUserId,
      })
      .orderBy('COALESCE(c.lastMessageAt, c.createdAt)', 'DESC')
      .getMany();

    return this.toSummaries(conversations, currentUserId);
  }

  private async toSummaries(
    conversations: Conversation[],
    currentUserId: string,
  ): Promise<ConversationSummary[]> {
    if (conversations.length === 0) return [];
    const ids = conversations.map((c) => c.id);

    const [lastMessages, unreadRows] = await Promise.all([
      this.messageRepo
        .createQueryBuilder('m')
        .distinctOn(['m.conversationId'])
        .where('m.conversationId IN (:...ids)', { ids })
        .orderBy('m.conversationId')
        .addOrderBy('m.createdAt', 'DESC')
        .getMany(),
      this.messageRepo
        .createQueryBuilder('m')
        .select('m.conversationId', 'conversationId')
        .addSelect('COUNT(*)', 'count')
        .where('m.conversationId IN (:...ids)', { ids })
        .andWhere('m.senderId != :userId', { userId: currentUserId })
        .andWhere('m.readAt IS NULL')
        .groupBy('m.conversationId')
        .getRawMany<{ conversationId: string; count: string }>(),
    ]);

    const lastMessageByConv = new Map(
      lastMessages.map((m) => [m.conversationId, m]),
    );
    const unreadByConv = new Map(
      unreadRows.map((r) => [r.conversationId, Number(r.count)]),
    );

    // Users loaded via the entity may not have needed relations if this conversation
    // came from startOrGet() (findOne without relations) — re-fetch with relations
    // in that case. list()'s query already joins them, so this only re-queries when
    // called from startOrGet() with a single freshly-created/found conversation.
    const needsUserRelations = conversations.some((c) => !c.userA || !c.userB);
    let byId = new Map<string, Conversation>();
    if (needsUserRelations) {
      const reloaded = await this.conversationRepo.find({
        where: { id: In(ids) },
        relations: { userA: { company: true }, userB: { company: true } },
      });
      byId = new Map(reloaded.map((c) => [c.id, c]));
    }

    return conversations.map((c) => {
      const full = byId.get(c.id) ?? c;
      const isUserA = full.userAId === currentUserId;
      const otherUserEntity = isUserA ? full.userB : full.userA;
      const otherUser: OtherUserSummary = {
        id: otherUserEntity.id,
        firstName: otherUserEntity.firstName,
        lastName: otherUserEntity.lastName,
        companyName: otherUserEntity.company?.companyName ?? null,
      };

      const lastMessage = lastMessageByConv.get(c.id);

      return {
        id: c.id,
        otherUser,
        listingType: c.cargoPostId
          ? 'cargo'
          : c.vehiclePostId
            ? 'vehicle'
            : null,
        cargoPostId: c.cargoPostId,
        vehiclePostId: c.vehiclePostId,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount: unreadByConv.get(c.id) ?? 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });
  }

  private async getOwnedConversation(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Razgovor nije pronađen.');
    }
    this.assertParticipant(conversation, userId);
    return conversation;
  }

  // Loads the full message history and marks every message from the other participant
  // as read — opening a conversation is what "reading" it means here, so there is no
  // separate mark-read endpoint to call from the frontend.
  async getMessages(
    conversationId: string,
    userId: string,
  ): Promise<Message[]> {
    await this.getOwnedConversation(conversationId, userId);

    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ readAt: () => 'now()' })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('readAt IS NULL')
      .execute();

    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    const conversation = await this.getOwnedConversation(
      conversationId,
      userId,
    );

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Poruka ne može biti prazna.');
    }

    const message = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        senderId: userId,
        content,
      }),
    );

    conversation.lastMessageAt = message.createdAt;
    await this.conversationRepo.save(conversation);

    return message;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepo
      .createQueryBuilder('m')
      .innerJoin('m.conversation', 'c')
      .where('(c.userAId = :userId OR c.userBId = :userId)', { userId })
      .andWhere('m.senderId != :userId', { userId })
      .andWhere('m.readAt IS NULL')
      .getCount();
  }
}
