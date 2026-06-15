import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  // PATCH /users/me — update firstName, lastName, phone
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.update(req.user.id, dto);
  }

  // PATCH /users/change-password
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
