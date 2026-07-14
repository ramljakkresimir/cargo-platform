import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

// This is the shape of the data we encode inside the JWT token
export interface JwtPayload {
  sub: string;    // "sub" is a standard JWT claim meaning "subject" = user ID
  email: string;
  iat?: number;   // standard "issued at" claim (seconds since epoch), added automatically on sign
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Tell Passport to look for the token in the Authorization: Bearer <token> header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Called automatically after the JWT signature is verified.
  // Whatever we return here becomes req.user in the controller.
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    // Reject tokens issued before the user's last password change so a stolen token
    // doesn't survive the victim changing their password for the rest of its 7-day life.
    if (user.passwordChangedAt && payload.iat && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
      throw new UnauthorizedException('Token invalidated by password change');
    }
    return user;
  }
}
