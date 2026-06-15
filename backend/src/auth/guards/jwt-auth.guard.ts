import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Apply @UseGuards(JwtAuthGuard) to any route that requires a logged-in user.
// It will check the Authorization header, verify the JWT, and populate req.user.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
