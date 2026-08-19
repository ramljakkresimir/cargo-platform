import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Used by the JWT strategy to validate who owns a token
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Used during login to find the account by email
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Used during registration to insert a new user
  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  // Generic save passthrough — used by AuthService for the email-verification /
  // password-reset / failed-login-tracking flows, which mutate a handful of different
  // field combinations that don't warrant their own DTO-driven update method each.
  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async findByEmailVerificationTokenHash(hash: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { emailVerificationTokenHash: hash },
    });
  }

  async findByPasswordResetTokenHash(hash: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { passwordResetTokenHash: hash },
    });
  }

  async update(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date();
    await this.userRepository.save(user);
    this.logger.log(`Password changed by user ${id}`);
    return { message: 'Password changed successfully' };
  }
}
