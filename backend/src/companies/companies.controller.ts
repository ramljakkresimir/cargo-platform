import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

// All company endpoints require a valid JWT token
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // GET /companies/me
  @Get('me')
  getMyCompany(@Request() req: any) {
    return this.companiesService.findByUserId(req.user.id);
  }

  // POST /companies
  @Post()
  createCompany(@Request() req: any, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(req.user.id, dto);
  }

  // PATCH /companies/me
  @Patch('me')
  updateMyCompany(@Request() req: any, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateByUserId(req.user.id, dto);
  }
}
