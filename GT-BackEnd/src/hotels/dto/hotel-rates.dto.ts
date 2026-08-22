import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { IsCurrencyCode } from '../../currency/dto/currency-code';

export class HotelRatesDto {
  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  checkin: string;

  @ApiProperty({ example: '2026-09-18' })
  @IsDateString()
  checkout: string;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : undefined,
  )
  @IsCurrencyCode()
  currency?: string = 'USD';

  @ApiPropertyOptional({ example: 2, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  adults?: number = 2;

  @ApiPropertyOptional({ example: 'US', default: 'US' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : undefined,
  )
  @Matches(/^[A-Z]{2}$/, {
    message: 'guestNationality must be a 2-letter ISO country code',
  })
  guestNationality?: string = 'US';
}
