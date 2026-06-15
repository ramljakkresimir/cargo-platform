import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclePost } from './vehicle-post.entity';
import { VehiclePostsService } from './vehicle-posts.service';
import { VehiclePostsController } from './vehicle-posts.controller';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VehiclePost]),
    CompaniesModule,
  ],
  providers: [VehiclePostsService],
  controllers: [VehiclePostsController],
})
export class VehiclePostsModule {}
