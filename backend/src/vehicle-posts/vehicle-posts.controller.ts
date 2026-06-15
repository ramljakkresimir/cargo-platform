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
import { VehiclePostsService } from './vehicle-posts.service';
import { CompaniesService } from '../companies/companies.service';
import { CreateVehiclePostDto } from './dto/create-vehicle-post.dto';
import { UpdateVehiclePostDto } from './dto/update-vehicle-post.dto';
import { FilterVehiclePostsDto } from './dto/filter-vehicle-posts.dto';

@Controller('vehicle-posts')
export class VehiclePostsController {
  constructor(
    private readonly vehiclePostsService: VehiclePostsService,
    private readonly companiesService: CompaniesService,
  ) {}

  // GET /vehicle-posts?vehicleType=truck&availableLocation=Mostar
  @Get()
  findAll(@Query() filters: FilterVehiclePostsDto) {
    return this.vehiclePostsService.findAll(filters);
  }

  // GET /vehicle-posts/my — returns all posts belonging to the logged-in user's company
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMine(@Request() req: any) {
    const company = await this.companiesService.findByUserId(req.user.id);
    return this.vehiclePostsService.findByCompanyId(company.id);
  }

  // GET /vehicle-posts/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclePostsService.findOne(id);
  }

  // POST /vehicle-posts
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() dto: CreateVehiclePostDto) {
    const company = await this.companiesService.findByUserId(req.user.id);
    return this.vehiclePostsService.create(company.id, dto);
  }

  // PATCH /vehicle-posts/:id
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateVehiclePostDto,
  ) {
    const company = await this.companiesService.findByUserId(req.user.id);
    return this.vehiclePostsService.update(id, company.id, dto);
  }

  // DELETE /vehicle-posts/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req: any, @Param('id') id: string) {
    const company = await this.companiesService.findByUserId(req.user.id);
    return this.vehiclePostsService.remove(id, company.id);
  }
}
