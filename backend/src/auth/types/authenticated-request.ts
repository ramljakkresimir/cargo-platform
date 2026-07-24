import { Request } from 'express';
import { User } from '../../users/user.entity';

// JwtStrategy.validate() returns the User entity, which Passport attaches to
// req.user — this gives every @Request() req: AuthenticatedRequest a typed
// req.user instead of Express's default `any`.
export interface AuthenticatedRequest extends Request {
  user: User;
}
