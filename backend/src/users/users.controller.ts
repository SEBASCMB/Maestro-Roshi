import { Controller, Post, Body, ConflictException, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
// import { User } from './user.entity'; // No longer directly used in DTO for register
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    // The createUserDto now directly fits the structure expected by usersService.create
    // after the service was updated for TypeORM (it expects email and password).
    // We must ensure UsersService.create is compatible with CreateUserDto.
    // Specifically, UsersService.create expects an object with email and password.
    // CreateUserDto provides exactly that.
    // The return type of usersService.create is Omit<User, 'password'>
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = await this.usersService.create(createUserDto);
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    console.log('UsersController: Profile request received for user:', req.user);
    // req.user is populated by JwtStrategy.validate()
    return req.user;
  }
}
