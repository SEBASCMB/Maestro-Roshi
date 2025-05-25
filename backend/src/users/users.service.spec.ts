import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  // Define mocks for queryBuilder methods so they can be spied on correctly
  const whereMock = jest.fn().mockReturnThis();
  const addSelectMock = jest.fn().mockReturnThis();
  const getOneMock = jest.fn();

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(), // Keep for direct findOne if ever used, though findByEmail uses queryBuilder
    createQueryBuilder: jest.fn(() => ({
      where: whereMock,
      addSelect: addSelectMock,
      getOne: getOneMock,
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Reset mocks before each test
    jest.clearAllMocks(); 
    // Specifically reset queryBuilder method mocks
    whereMock.mockClear().mockReturnThis();
    addSelectMock.mockClear().mockReturnThis();
    getOneMock.mockClear();

  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = { email: 'test@example.com', password: 'password123' };
    const hashedPassword = 'hashedPassword123';
    // Important: The userEntity that repository.create returns should be what repository.save is called with.
    const createdUserEntity = { id: 1, email: createUserDto.email, password: hashedPassword }; 
    // The userEntity that repository.save resolves with (simulating DB returning the saved entity)
    const savedUserEntity = { ...createdUserEntity };


    beforeEach(() => {
      // Common mocks for create tests
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue(createdUserEntity); 
      mockUserRepository.save.mockResolvedValue(savedUserEntity);
      // Default for findByEmail (called internally by create) is that user does not exist
      getOneMock.mockResolvedValue(undefined); 
    });
    
    // No need for afterEach with jest.clearAllMocks() in the main beforeEach

    it('should successfully create a user', async () => {
      const { password, ...expectedResult } = savedUserEntity; 
      
      const result = await service.create(createUserDto);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({ // ensure this matches what service calls create with
        email: createUserDto.email,
        password: hashedPassword,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(createdUserEntity); // service.create saves the result of userRepository.create
      expect(result).toEqual(expectedResult); // service.create returns the saved entity (minus password)
    });

    it('should throw ConflictException if email already exists', async () => {
      // Mock findByEmail (via getOneMock) to return an existing user
      // Reset any globally set mock behavior for getOneMock for this specific test
      getOneMock.mockReset(); // Clears implementation, calls, and results
      getOneMock.mockResolvedValue(savedUserEntity); // Simulate user found

      // Ensure that the createQueryBuilder mock itself is fresh for this call count
      // (though it's usually called once per findByEmail)
      mockUserRepository.createQueryBuilder.mockClear(); 
      whereMock.mockClear().mockReturnThis(); // Clear these as well for this specific test path

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      
      // Check that findByEmail was called by create
      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(whereMock).toHaveBeenCalledWith('user.email = :email', { email: createUserDto.email });
      expect(getOneMock).toHaveBeenCalledTimes(1); // This specific getOneMock call

      // Ensure other operations didn't happen
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

     it('should throw an error if password is not provided', async () => {
      await expect(service.create({ email: 'test@example.com' } as any)) // Cast to any to bypass DTO type for test
        .rejects.toThrow('Password is required to create a user.');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    const email = 'test@example.com';
    const userEntityFromDb = { id: 1, email, password: 'hashedPassword123' };

    // No afterEach needed due to global clear in main beforeEach

    it('should return a user if found (without password)', async () => {
      getOneMock.mockResolvedValue(userEntityFromDb);
      const { password, ...expectedResult } = userEntityFromDb;

      const result = await service.findByEmail(email);

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(whereMock).toHaveBeenCalledWith('user.email = :email', { email });
      // By default, password is not explicitly selected by addSelect, but also not excluded if not select:false
      // The service logic then strips it.
      expect(addSelectMock).not.toHaveBeenCalled(); 
      expect(getOneMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should return a user if found (with password)', async () => {
      getOneMock.mockResolvedValue(userEntityFromDb);
      
      const result = await service.findByEmail(email, true);

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(whereMock).toHaveBeenCalledWith('user.email = :email', { email });
      // If includePassword is true, UsersService does NOT explicitly call addSelect('user.password')
      // because our User entity's password column does not have `select: false`.
      // TypeORM selects all columns by default if not specified otherwise.
      // The `if (includePassword)` block in service is for the case where it *was* `select: false`.
      // So, addSelectMock should NOT be called here.
      expect(addSelectMock).not.toHaveBeenCalled(); 
      expect(getOneMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(userEntityFromDb); // Full entity expected
    });

    it('should return undefined if user not found', async () => {
      getOneMock.mockResolvedValue(undefined);
      
      const result = await service.findByEmail(email);

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(whereMock).toHaveBeenCalledWith('user.email = :email', { email });
      expect(getOneMock).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });
});
