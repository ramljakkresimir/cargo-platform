import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(userId: string, dto: CreateCompanyDto): Promise<Company> {
    // Each user may only have one company profile
    const existing = await this.companyRepository.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('You already have a company profile');
    }

    const company = this.companyRepository.create({ ...dto, userId });
    return this.companyRepository.save(company);
  }

  // Used by the /companies/me endpoint and by post controllers to find the user's company
  async findByUserId(userId: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { userId } });
    if (!company) {
      throw new NotFoundException(
        'Company profile not found. Please create one before posting.',
      );
    }
    return company;
  }

  async findById(id: string): Promise<Company | null> {
    return this.companyRepository.findOne({ where: { id } });
  }

  async updateByUserId(userId: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findByUserId(userId);
    // Object.assign merges only the provided fields into the existing entity
    Object.assign(company, dto);
    return this.companyRepository.save(company);
  }
}
