import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { CargoPostsModule } from './cargo-posts/cargo-posts.module';
import { VehiclePostsModule } from './vehicle-posts/vehicle-posts.module';
import { AdminModule } from './admin/admin.module';
import { User } from './users/user.entity';
import { Company } from './companies/company.entity';
import { CargoPost } from './cargo-posts/cargo-post.entity';
import { VehiclePost } from './vehicle-posts/vehicle-post.entity';

@Module({
  imports: [
    // Load .env file and make ConfigService available everywhere
    ConfigModule.forRoot({ isGlobal: true }),

    // Connect to PostgreSQL. synchronize:true auto-creates/updates tables from entities.
    // Switch synchronize to false in production and use migrations instead.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        entities: [User, Company, CargoPost, VehiclePost],
        synchronize: true,
      }),
    }),

    AuthModule,
    UsersModule,
    CompaniesModule,
    CargoPostsModule,
    VehiclePostsModule,
    AdminModule,
  ],
})
export class AppModule {}
