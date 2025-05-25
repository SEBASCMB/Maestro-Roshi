import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Import TypeOrmModule for User entity
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export UsersService if it's used by other modules (e.g., AuthModule)
})
export class UsersModule {}
