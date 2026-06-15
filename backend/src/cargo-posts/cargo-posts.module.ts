import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargoPost } from './cargo-post.entity';
import { CargoPostsService } from './cargo-posts.service';
import { CargoPostsController } from './cargo-posts.controller';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CargoPost]),
    CompaniesModule, // Import so the controller can use CompaniesService
  ],
  providers: [CargoPostsService],
  controllers: [CargoPostsController],
})
export class CargoPostsModule {}
