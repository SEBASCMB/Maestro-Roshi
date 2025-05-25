import { Controller, Request, Post, UseGuards, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto'; // Import LoginDto

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK) // Standard practice to return 200 OK for successful login
  async login(@Request() req, @Body() loginDto: LoginDto) { // Add LoginDto, req.user is populated by AuthGuard
    console.log('AuthController: Login request received for user:', req.user.email);
    // loginDto is validated by ValidationPipe. req.user comes from LocalStrategy's validate method.
    return this.authService.login(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK) // Standard practice to return 200 OK
  async logout() {
    // For JWT, logout is typically handled client-side by deleting the token.
    // This endpoint is a placeholder. If we implement refresh tokens or server-side session management,
    // this endpoint would handle token invalidation.
    console.log('AuthController: Logout request received');
    return { message: 'Logged out successfully' };
  }
}
