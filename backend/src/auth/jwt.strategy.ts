import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'yourSecretKey', // TODO: Move this to environment variables
    });
  }

  async validate(payload: any) {
    console.log('JwtStrategy: Validating payload:', payload);
    // For now, we'll return the payload directly.
    // In a real application, you might want to look up the user in the database
    // based on payload.sub (user ID) to ensure the user still exists, etc.
    return { userId: payload.sub, email: payload.email };
  }
}
