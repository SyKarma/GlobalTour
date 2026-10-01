import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from '../database/entities/user-preference.entity';
import { User } from '../database/entities/user.entity';
import { GoogleProfileInput } from './auth.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(UserPreference)
    private readonly preferences: Repository<UserPreference>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({
      where: { id },
      relations: ['preferences'],
    });
  }

  async upsertFromGoogle(profile: GoogleProfileInput): Promise<User> {
    const existing = await this.findExistingGoogleUser(profile);
    if (existing) {
      existing.googleId = profile.googleId;
      existing.email = profile.email;
      existing.displayName = profile.displayName;
      existing.avatarUrl = profile.avatarUrl;
      if (!existing.preferences) {
        existing.preferences = this.preferences.create({
          preferredCurrency: 'USD',
        });
      }
      return this.users.save(existing);
    }

    const user = this.users.create({
      googleId: profile.googleId,
      email: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      preferences: this.preferences.create({
        preferredCurrency: 'USD',
      }),
    });
    return this.users.save(user);
  }

  private async findExistingGoogleUser(
    profile: GoogleProfileInput,
  ): Promise<User | null> {
    const byGoogleId = await this.users.findOne({
      where: { googleId: profile.googleId },
      relations: ['preferences'],
    });
    if (byGoogleId) {
      return byGoogleId;
    }

    return this.users.findOne({
      where: { email: profile.email },
      relations: ['preferences'],
    });
  }
}
