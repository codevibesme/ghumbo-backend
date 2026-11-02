import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: any,
    user: TUser | false | null,
    _info: any,
    _context: ExecutionContext,
  ): TUser | null {
    if (err) {
      throw err;
    }

    return user || null;
  }
}
