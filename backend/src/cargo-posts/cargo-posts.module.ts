import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargoPost } from './cargo-post.entity';
import { CargoPostsService } from './cargo-posts.service';
import { CargoPostsController } from './cargo-posts.controller';
import { CompaniesModule } from '../companies/companies.module';
import { CitiesModule } from '../cities/cities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CargoPost]),
    CompaniesModule,
    CitiesModule,
  ],
  providers: [CargoPostsService],
  controllers: [CargoPostsController],
})
export class CargoPostsModule {}
