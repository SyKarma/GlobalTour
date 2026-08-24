import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../../database/entities/user.entity';
import { UsersService } from '../users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const findById = jest.fn<(id: string) => Promise<User | null>>();

  beforeEach(async () => {
    findById.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: { findById } },
        {
          provide: ConfigService,
          useValue: {
            get: () => 'test-secret',
          },
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
  });

  it('returns the user for a valid payload', async () => {
    const user = { id: 'user-1', email: 'sam@example.com' } as User;
    findById.mockResolvedValue(user);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'sam@example.com' }),
    ).resolves.toBe(user);
  });

  it('rejects payloads for unknown users', async () => {
    findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'missing', email: 'gone@example.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
