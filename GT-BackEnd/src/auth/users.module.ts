import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreference } from '../database/entities/user-preference.entity';
import { User } from '../database/entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreference])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
