import { IsString, IsEnum, IsEmail, IsOptional } from 'class-validator';
import { CompanyType } from '../company.entity';

export class CreateCompanyDto {
  @IsString()
  companyName: string;

  @IsEnum(CompanyType, {
    message: 'companyType must be one of: transport, freight_forwarder, manufacturer, trader, other',
  })
  companyType: CompanyType;

  @IsString()
  country: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
