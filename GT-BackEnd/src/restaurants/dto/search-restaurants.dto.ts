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
import { FOOD_AMENITIES, type FoodAmenity } from '../overpass.types';

export class SearchRestaurantsDto {
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
    example: 4000,
    default: 4000,
    description: 'Search radius in meters (100–50000)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(50_000)
  radius?: number = 4000;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Max restaurants to return',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: '',
    enum: FOOD_AMENITIES,
    description: 'OSM amenity: restaurant, cafe, or fast_food',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeAmenity(value))
  @IsIn(FOOD_AMENITIES, {
    message: 'type must be restaurant, cafe, or fast_food',
  })
  type?: FoodAmenity;

  @ApiPropertyOptional({
    example: '',
    description: 'OSM cuisine tag, e.g. japanese, italian, costa_rican',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeCuisine(value))
  @Matches(/^[a-z0-9_]{2,40}$/, {
    message: 'cuisine must be a lowercase OSM cuisine tag',
  })
  cuisine?: string;

  @ApiPropertyOptional({
    example: '',
    description: 'Case-insensitive name contains',
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

export function normalizeAmenity(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (slug === 'fastfood') {
    return 'fast_food';
  }
  return slug || undefined;
}

export function normalizeCuisine(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return slug || undefined;
}
