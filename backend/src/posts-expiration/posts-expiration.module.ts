import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';
import { PostsExpirationService } from './posts-expiration.service';

@Module({
  imports: [TypeOrmModule.forFeature([CargoPost, VehiclePost])],
  providers: [PostsExpirationService],
  exports: [PostsExpirationService],
})
export class PostsExpirationModule {}
