import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  @MinLength(1)
  CORS_ORIGIN: string;

  @IsString()
  @MinLength(1)
  FRONTEND_URL: string = 'http://localhost:5173';

  @IsString()
  @MinLength(1)
  JWT_SECRET: string;

  @IsString()
  @MinLength(1)
  DATABASE_HOST: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  DATABASE_PORT: number = 3306;

  @IsString()
  @MinLength(1)
  DATABASE_USER: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  @MinLength(1)
  DATABASE_NAME: string;

  @IsString()
  @MinLength(1)
  TRAVELPAYOUTS_API_TOKEN: string;

  @IsUrl({ require_tld: false })
  FRANKFURTER_BASE_URL: string;

  @IsString()
  @MinLength(1)
  LITEAPI_API_KEY: string;

  @IsUrl({ require_tld: false })
  LITEAPI_BASE_URL: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CALLBACK_URL?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${messages}`);
  }

  return validated;
}
