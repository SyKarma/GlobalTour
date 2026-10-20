import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { AUTH_RETURN_COOKIE_NAME } from './auth.constants';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly auth: AuthService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    this.auth.assertConfigured();
    this.rememberReturnTo(context);
    return super.canActivate(context);
  }

  /**
   * On the first step (/auth/google?returnTo=...) keep the page the user
   * came from, so the callback can send them back to the same frontend
   * (for example localhost:5174) instead of always FRONTEND_URL.
   */
  private rememberReturnTo(context: ExecutionContext): void {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    if (request.path.endsWith('/callback')) {
      return;
    }

    const returnTo = this.auth.safeReturnTo(request.query?.returnTo);
    if (returnTo) {
      http
        .getResponse<Response>()
        .cookie(
          AUTH_RETURN_COOKIE_NAME,
          returnTo,
          this.auth.returnCookieOptions(),
        );
    }
  }
}
