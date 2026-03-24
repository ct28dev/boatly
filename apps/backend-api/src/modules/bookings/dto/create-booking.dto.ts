import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'Product/Tour ID' })
  @IsString()
  product_id: string;

  @ApiPropertyOptional({ description: 'Schedule ID' })
  @IsOptional()
  @IsString()
  schedule_id?: string;

  @ApiProperty({ description: 'Booking date', example: '2026-04-15' })
  @IsDateString()
  booking_date: string;

  @ApiProperty({ description: 'Number of adults', minimum: 1 })
  @IsNumber()
  @Min(1)
  adult_count: number;

  @ApiPropertyOptional({ description: 'Number of children', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  child_count?: number;

  @ApiPropertyOptional({ description: 'Number of infants', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  infant_count?: number;

  @ApiProperty({ description: 'Contact name' })
  @IsString()
  contact_name: string;

  @ApiProperty({ description: 'Contact phone' })
  @IsString()
  contact_phone: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @ApiPropertyOptional({ description: 'Special requests' })
  @IsOptional()
  @IsString()
  special_requests?: string;

  @ApiPropertyOptional({ description: 'Promotion code' })
  @IsOptional()
  @IsString()
  promotion_code?: string;
}
