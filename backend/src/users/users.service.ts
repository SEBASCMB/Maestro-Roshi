import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: Omit<User, 'id' | 'password'> & { password?: string }): Promise<Omit<User, 'password'>> {
    console.log('Creating user with data:', { email: userData.email }); // Avoid logging password
    if (!userData.password) {
      throw new Error('Password is required to create a user.'); // Or handle as a BadRequestException
    }
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltOrRounds);
    
    const newUser = this.usersRepository.create({
      email: userData.email, // Make sure to only pass properties defined in User entity
      password: hashedPassword,
    });
    
    await this.usersRepository.save(newUser);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = newUser;
    return result;
  }

  async findByEmail(email: string, includePassword?: boolean): Promise<User | undefined> {
    console.log('Searching for user with email:', email);
    const queryBuilder = this.usersRepository.createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (includePassword) {
      // By default, all columns are selected, including 'password'.
      // If 'password' column was set to `select: false` in the entity,
      // then you would need: queryBuilder.addSelect('user.password');
    }

    const user = await queryBuilder.getOne();

    if (user) {
      if (includePassword) {
        return user; // Password will be included if it was selected
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; // Ensure password is not returned by default
      return result as User; // Cast to User to satisfy the return type if password was dynamically excluded
    }
    return undefined;
  }
}
