import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserPreference } from '../database/entities/user-preference.entity';
import { User } from '../database/entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const findOne = jest.fn();
  const save = jest.fn();
  const usersCreate = jest.fn((row: object) => row);
  const prefsCreate = jest.fn((row: object) => row);

  const profile = {
    googleId: 'google-1',
    email: 'sam@example.com',
    displayName: 'Sam',
    avatarUrl: 'https://example.com/a.png',
  };

  beforeEach(async () => {
    findOne.mockReset();
    save.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: { findOne, save, create: usersCreate },
        },
        {
          provide: getRepositoryToken(UserPreference),
          useValue: { create: prefsCreate },
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('creates a user with default USD preferences', async () => {
    findOne.mockResolvedValue(null);
    save.mockImplementation((user: object) =>
      Promise.resolve({ id: 'user-1', ...user }),
    );

    const created = await service.upsertFromGoogle(profile);

    expect(prefsCreate).toHaveBeenCalledWith({ preferredCurrency: 'USD' });
    expect(usersCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        googleId: 'google-1',
        email: 'sam@example.com',
        displayName: 'Sam',
      }),
    );
    expect(created).toMatchObject({
      id: 'user-1',
      email: 'sam@example.com',
    });
  });

  it('updates an existing Google user', async () => {
    findOne.mockResolvedValueOnce({
      id: 'user-1',
      googleId: 'google-1',
      email: 'old@example.com',
      displayName: 'Old',
      avatarUrl: null,
      preferences: { preferredCurrency: 'EUR' },
    });
    save.mockImplementation((user: object) => Promise.resolve(user));

    const updated = await service.upsertFromGoogle(profile);

    expect(updated.email).toBe('sam@example.com');
    expect(updated.displayName).toBe('Sam');
    expect(updated.preferences.preferredCurrency).toBe('EUR');
  });

  it('links by email when the Google id is new', async () => {
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'user-2',
      googleId: 'old-google',
      email: 'sam@example.com',
      displayName: 'Sam',
      avatarUrl: null,
      preferences: { preferredCurrency: 'USD' },
    });
    save.mockImplementation((user: object) => Promise.resolve(user));

    const linked = await service.upsertFromGoogle(profile);

    expect(linked.googleId).toBe('google-1');
    expect(linked.id).toBe('user-2');
  });
});
