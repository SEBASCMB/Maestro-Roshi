import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const testUser = { email: 'test@example.com', password: 'password123' };
  const testUserInvalidEmail = { email: 'notanemail', password: 'password123' };
  const testUserShortPassword = { email: 'test2@example.com', password: '123' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // AppModule already sets up TypeORM, entities, etc.
    })
    // We can override the main database connection to use a test-specific one
    // For simplicity here, we'll use the main dev database with synchronize:true
    // but in a real CI/CD, a separate test DB is crucial.
    // Ensure the test DB is clean before tests if not using transactions or specific cleanup.
    .overrideProvider(getRepositoryToken(User)) // Ensure we get the right User repository
    .useValue(null) // This is a placeholder, TypeORM setup in AppModule will be used.
                    // If specific mock repo needed for e2e, setup here.
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    // Clean up the user table before tests
    if (userRepository) {
        await userRepository.query('DELETE FROM "user";'); // Use specific table name if needed
    }
  });
  
  afterAll(async () => {
    // Clean up the user table after tests
    if (userRepository) {
        await userRepository.query('DELETE FROM "user";');
    }
    await app.close();
  });

  beforeEach(async () => {
    // Clean user table before each test for isolation
     if (userRepository) {
        await userRepository.query('DELETE FROM "user";');
    }
  });


  describe('/users/register (POST)', () => {
    it('should register a user successfully', () => {
      return request(app.getHttpServer())
        .post('/users/register')
        .send(testUser)
        .expect(HttpStatus.CREATED)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(response.body.email).toEqual(testUser.email);
          expect(response.body.id).toBeDefined();
          expect(response.body.password).toBeUndefined();
        });
    });

    it('should fail if email is invalid', () => {
      return request(app.getHttpServer())
        .post('/users/register')
        .send(testUserInvalidEmail)
        .expect(HttpStatus.BAD_REQUEST)
        .then(response => {
            expect(response.body.message).toEqual(expect.arrayContaining(['Please provide a valid email address.']));
        });
    });

    it('should fail if password is too short', () => {
      return request(app.getHttpServer())
        .post('/users/register')
        .send(testUserShortPassword)
        .expect(HttpStatus.BAD_REQUEST)
        .then(response => {
            expect(response.body.message).toEqual(expect.arrayContaining(['Password must be at least 8 characters long.']));
        });
    });
    
    it('should fail if email already exists', async () => {
      // First, register the user
      await request(app.getHttpServer())
        .post('/users/register')
        .send(testUser)
        .expect(HttpStatus.CREATED);

      // Then, attempt to register the same user again
      return request(app.getHttpServer())
        .post('/users/register')
        .send(testUser)
        .expect(HttpStatus.CONFLICT)
        .then(response => {
            expect(response.body.message).toEqual('Email already exists');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Register a user before each login test
      await request(app.getHttpServer())
        .post('/users/register')
        .send(testUser)
        .expect(HttpStatus.CREATED);
    });

    it('should login successfully and return an access_token', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(HttpStatus.OK)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(response.body.access_token).toBeDefined();
        });
    });

    it('should fail to login with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(HttpStatus.UNAUTHORIZED); // UnauthorizedException
    });

    it('should fail to login with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: testUser.password })
        .expect(HttpStatus.UNAUTHORIZED); // UnauthorizedException
    });

    it('should fail with invalid email format during login', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserInvalidEmail)
        .expect(HttpStatus.BAD_REQUEST)
         .then(response => {
            expect(response.body.message).toEqual(expect.arrayContaining(['Please provide a valid email address.']));
        });
    });
  });

  describe('/users/profile (GET)', () => {
    let token: string;

    beforeEach(async () => {
      // Register and login user to get token
      await request(app.getHttpServer())
        .post('/users/register')
        .send(testUser)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUser)
        .expect(HttpStatus.OK);
      token = loginResponse.body.access_token;
    });

    it('should access profile with a valid JWT', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(response.body.email).toEqual(testUser.email);
          expect(response.body.userId).toBeDefined(); // or id, depending on JwtStrategy
        });
    });

    it('should fail to access profile without JWT', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .expect(HttpStatus.UNAUTHORIZED); // Default Unauthorized for missing JWT
    });

    it('should fail to access profile with an invalid JWT', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer invalidtoken123')
        .expect(HttpStatus.UNAUTHORIZED); // JwtStrategy should reject invalid token
    });
  });
});
