import { IsString, IsInt, IsPositive, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvestmentDto {
  @IsString()
  propertyId: string;

  @IsInt()
  @IsPositive()
  @Max(10)
  @Type(() => Number)
  sharesPurchased: number; // 1 share = 10%, max 10 shares = 100%

  @IsOptional()
  @IsString()
  notes?: string;
}
