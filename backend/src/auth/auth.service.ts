import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(`AuthService: Validating user ${email}`);
    const user = await this.usersService.findByEmail(email, true); // Request password field
    if (user && user.password && await bcrypt.compare(pass, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      console.log(`AuthService: User ${email} validated successfully`);
      return result;
    }
    console.log(`AuthService: User ${email} validation failed`);
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    console.log(`AuthService: Generating JWT for user ${user.email} with payload:`, payload);
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
