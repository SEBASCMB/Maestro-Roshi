import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // Use 'email' as the username field
  }

  async validate(email: string, pass: string): Promise<any> {
    console.log(`LocalStrategy: Validating user ${email}`);
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      console.log(`LocalStrategy: User ${email} validation failed`);
      throw new UnauthorizedException();
    }
    console.log(`LocalStrategy: User ${email} validated successfully`);
    return user;
  }
}
