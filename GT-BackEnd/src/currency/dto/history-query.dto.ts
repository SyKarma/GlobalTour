import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';
import { IsCurrencyCode } from './currency-code';

export class HistoryQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2026-01-31' })
  @IsDateString()
  to: string;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsCurrencyCode()
  base?: string = 'USD';

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsCurrencyCode()
  quote?: string;
}
