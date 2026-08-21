import {
  Controller,
  Get,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  @ApiOkResponse({ description: 'API process is running' })
  liveness() {
    return {
      data: {
        status: 'ok',
      },
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check including MySQL' })
  async readiness() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        data: {
          status: 'ok',
          database: 'up',
        },
      };
    } catch {
      throw new ServiceUnavailableException({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database unavailable',
      });
    }
  }
}
