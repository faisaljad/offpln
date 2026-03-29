import {
  IsString,
  IsNumber,
  IsInt,
  IsArray,
  IsObject,
  IsOptional,
  IsEnum,
  Min,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyStatus } from '@prisma/client';

export class CreatePropertyDto {
  @IsString()
  refNumber: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  developer?: string;

  @IsOptional()
  @IsString()
  developerLogo?: string;

  @IsOptional()
  @IsString()
  profitType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  originalPrice?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalPrice: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  totalShares: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  roi: number;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsObject()
  paymentPlan: Record<string, any>;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  area?: number;

  @IsOptional()
  @IsString()
  handoverDate?: string;

  @IsOptional()
  @IsString()
  propertyTypeId?: string;
}
