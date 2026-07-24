import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CargoPostsService } from './cargo-posts.service';
import { CompaniesService } from '../companies/companies.service';
import { CreateCargoPostDto } from './dto/create-cargo-post.dto';
import { UpdateCargoPostDto } from './dto/update-cargo-post.dto';
import { FilterCargoPostsDto } from './dto/filter-cargo-posts.dto';

@Controller('cargo-posts')
export class CargoPostsController {
  constructor(
    private readonly cargoPostsService: CargoPostsService,
    // We need CompaniesService to find the user's company when creating/editing posts
    private readonly companiesService: CompaniesService,
  ) {}

  // GET /cargo-posts?loadingLocation=Sarajevo&cargoType=general
  // Public endpoint — no authentication needed to browse posts
  @Get()
  findAll(@Query() filters: FilterCargoPostsDto) {
    return this.cargoPostsService.findAll(filters);
  }

  // GET /cargo-posts/my — returns all posts belonging to the logged-in user's company
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMine(@Request() req: AuthenticatedRequest) {
    const company = await this.companiesService.findByUserId(req.user.id);
    return this.cargoPostsService.findByCompanyId(company.id);
  }

  // GET /cargo-posts/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cargoPostsService.findOne(id);
  }

  // POST /cargo-posts — requires login
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateCargoPostDto,
  ) {
    // Look up the company that belongs to this user
    const company = await this.companiesService.findByUserId(req.user.id);
    return this.cargoPostsService.create(company.id, dto);
  }

  // PATCH /cargo-posts/:id — requires login + must be the owner
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCargoPostDto,
  ) {
    const company = await this.companiesService.findByUserId(req.user.id);
    return this.cargoPostsService.update(id, company.id, dto);
  }

  // DELETE /cargo-posts/:id — requires login + must be the owner
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const company = await this.companiesService.findByUserId(req.user.id);
    return this.cargoPostsService.remove(id, company.id);
  }
}
