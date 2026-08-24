import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SearchDestinationsDto {
  @ApiPropertyOptional({ example: 'barcelona' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  q?: string;

  @ApiPropertyOptional({ example: 'ES' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : undefined,
  )
  @Matches(/^[A-Z]{2}$/, { message: 'country must be a 2-letter ISO code' })
  country?: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
