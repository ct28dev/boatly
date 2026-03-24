import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PassengerType } from '../entities/booking-passenger.entity';

export class PassengerDto {
  @ApiProperty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsString()
  last_name: string;

  @ApiProperty({ enum: PassengerType })
  @IsEnum(PassengerType)
  type: PassengerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id_card_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passport_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medical_conditions?: string;
}

export class AddPassengersDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  booking_id: string;

  @ApiProperty({ type: [PassengerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];
}
