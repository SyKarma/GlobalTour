import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { User } from '../database/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('google')
  @SkipThrottle()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Start Google OAuth',
    description:
      'Browser redirect to Google. Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
  })
  googleAuth() {
    return undefined;
  }

  @Get('google/callback')
  @SkipThrottle()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Sets an httpOnly JWT cookie and redirects to FRONTEND_URL/?auth=success.',
  })
  googleCallback(@CurrentUser() user: User, @Res() res: Response): void {
    const token = this.auth.signToken(user);
    res.cookie(this.auth.cookieName(), token, this.auth.cookieOptions());
    res.redirect(this.auth.frontendRedirectUrl());
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Current user, or 401 for guests' })
  @ApiOkResponse({ description: 'Authenticated profile and preferences' })
  @ApiUnauthorizedResponse({
    description: 'No valid session cookie — treat as a guest',
  })
  me(@CurrentUser() user: User) {
    return { data: this.auth.toPublicUser(user) };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({ summary: 'Clear the session cookie' })
  @ApiOkResponse({ description: 'Cookie cleared' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(this.auth.cookieName(), this.auth.cookieOptions());
    return { data: { loggedOut: true } };
  }
}
