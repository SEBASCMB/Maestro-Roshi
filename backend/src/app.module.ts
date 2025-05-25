import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity'; // Import User entity

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: 'localhost', // TODO: Move to environment variables
        port: 5432, // TODO: Move to environment variables
        username: 'youruser', // TODO: Move to environment variables
        password: 'yourpassword', // TODO: Move to environment variables
        database: 'nestdb', // TODO: Move to environment variables
        entities: [User], // Include User entity
        synchronize: true, // Auto-create schema (dev only)
        // logging: true, // Optional: Enable logging for debugging
      }),
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
