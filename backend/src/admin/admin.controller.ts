import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { PostsExpirationService } from '../posts-expiration/posts-expiration.service';
import { AdminUsersQueryDto, AdminPostsQueryDto } from './dto/admin-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly postsExpirationService: PostsExpirationService,
  ) {}

  // GET /admin/stats
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // POST /admin/posts/expire-old — manually trigger the expiration job
  @Post('posts/expire-old')
  expireOldPosts() {
    return this.postsExpirationService.expireOldPosts();
  }

  // ── Users ──────────────────────────────────────────────────────────

  // GET /admin/users?page=1&limit=20&search=john
  @Get('users')
  getUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  // PATCH /admin/users/:id/role
  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: any,
  ) {
    return this.adminService.updateUserRole(id, dto, req.user.id);
  }

  // DELETE /admin/users/:id
  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteUser(id, req.user.id);
  }

  // ── Cargo Posts ────────────────────────────────────────────────────

  // GET /admin/cargo-posts?page=1&limit=20&search=sarajevo&status=active
  @Get('cargo-posts')
  getCargoPosts(@Query() query: AdminPostsQueryDto) {
    return this.adminService.getCargoPosts(query);
  }

  // PATCH /admin/cargo-posts/:id/status
  @Patch('cargo-posts/:id/status')
  updateCargoPostStatus(@Param('id') id: string, @Body() dto: UpdatePostStatusDto) {
    return this.adminService.updateCargoPostStatus(id, dto);
  }

  // DELETE /admin/cargo-posts/:id
  @Delete('cargo-posts/:id')
  deleteCargoPost(@Param('id') id: string) {
    return this.adminService.deleteCargoPost(id);
  }

  // ── Vehicle Posts ──────────────────────────────────────────────────

  // GET /admin/vehicle-posts?page=1&limit=20&search=truck&status=active
  @Get('vehicle-posts')
  getVehiclePosts(@Query() query: AdminPostsQueryDto) {
    return this.adminService.getVehiclePosts(query);
  }

  // PATCH /admin/vehicle-posts/:id/status
  @Patch('vehicle-posts/:id/status')
  updateVehiclePostStatus(@Param('id') id: string, @Body() dto: UpdatePostStatusDto) {
    return this.adminService.updateVehiclePostStatus(id, dto);
  }

  // DELETE /admin/vehicle-posts/:id
  @Delete('vehicle-posts/:id')
  deleteVehiclePost(@Param('id') id: string) {
    return this.adminService.deleteVehiclePost(id);
  }
}
