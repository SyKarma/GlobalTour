import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CAR_AMENITIES, type CarAmenity } from '../car.types';

export class SearchCarsDto {
  @ApiProperty({
    example: 'San Jose',
    description:
      'City name. Uses OpenStreetMap Nominatim, not the flight catalog.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  cityName: string;

  @ApiPropertyOptional({
    example: 'CR',
    description:
      'ISO country code. Required when the city name exists in more than one country.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : undefined,
  )
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter ISO code' })
  countryCode?: string;

  @ApiPropertyOptional({
    example: 8000,
    default: 8000,
    description: 'Search radius in meters (100–50000)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(50_000)
  radius?: number = 8000;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Max rental locations to return',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'car_rental',
    enum: CAR_AMENITIES,
    description: 'OSM amenity: car_rental or car_sharing',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, '_')
      : undefined,
  )
  @IsIn(CAR_AMENITIES, {
    message: 'type must be car_rental or car_sharing',
  })
  type?: CarAmenity;

  @ApiPropertyOptional({
    example: 'hertz',
    description: 'Case-insensitive name or brand contains',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  q?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Only places that have a website in OSM',
  })
  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === true || value === 'true',
  )
  @IsBoolean()
  hasWebsite?: boolean;
}
