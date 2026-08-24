import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const query = jest.fn<() => Promise<unknown>>();

  beforeEach(async () => {
    query.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getDataSourceToken(),
          useValue: { query },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns ok for liveness', () => {
    expect(controller.liveness()).toEqual({ data: { status: 'ok' } });
  });

  it('returns ok when the database responds', async () => {
    query.mockResolvedValue([{ 1: 1 }]);
    await expect(controller.readiness()).resolves.toEqual({
      data: { status: 'ok', database: 'up' },
    });
  });

  it('throws when the database is down', async () => {
    query.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(controller.readiness()).rejects.toThrow(
      'Database unavailable',
    );
  });
});
