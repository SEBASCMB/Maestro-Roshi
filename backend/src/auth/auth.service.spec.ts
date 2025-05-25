import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity'; // Import User entity

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const userFromDb: User = { id: 1, email, password: 'hashedPassword123' }; // User has id, email, password
    // Ensure the returned user from validateUser does not include password.
    const expectedUserResult: Omit<User, 'password'> = { id: 1, email };


    it('should return user object (without password) if validation is successful', async () => {
      mockUsersService.findByEmail.mockResolvedValue(userFromDb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);
      expect(usersService.findByEmail).toHaveBeenCalledWith(email, true); // includePassword = true
      expect(bcrypt.compare).toHaveBeenCalledWith(password, userFromDb.password);
      expect(result).toEqual(expectedUserResult);
    });

    it('should return null if password does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue(userFromDb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(email, password);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, userFromDb.password);
      expect(result).toBeNull();
    });

    it('should return null if user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(email, password);
      expect(usersService.findByEmail).toHaveBeenCalledWith(email, true);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

     it('should return null if user is found but has no password stored (edge case)', async () => {
      const userWithoutPassword = { id: 1, email, password: undefined } as User;
      mockUsersService.findByEmail.mockResolvedValue(userWithoutPassword);
      
      const result = await service.validateUser(email, password);
      expect(usersService.findByEmail).toHaveBeenCalledWith(email, true);
      expect(bcrypt.compare).not.toHaveBeenCalled(); // Should not attempt compare if no password
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access_token', async () => { // Made this async
      const user = { email: 'test@example.com', id: 1 };
      const token = 'mockAccessToken';
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id });
      expect(result).toEqual({ access_token: token });
    });
  });
});
