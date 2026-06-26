import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PostsExpirationModule } from '../posts-expiration/posts-expiration.module';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, CargoPost, VehiclePost]),
    PostsExpirationModule,
    RoutingModule,
  ],
  providers: [AdminService, RolesGuard],
  controllers: [AdminController],
})
export class AdminModule {}
