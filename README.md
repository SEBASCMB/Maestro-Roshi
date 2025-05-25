# Maestro-Roshi

This project contains a frontend and a NestJS backend application.

## Frontend

(Instructions for the frontend can be added here later.)

## Backend

This section describes how to set up and run the NestJS backend application.

### Prerequisites

*   **Node.js**: Version >= 18.x recommended (due to NestJS v11 requirements).
*   **npm**: Included with Node.js.
*   **PostgreSQL**: A running PostgreSQL server instance.

### Setup Instructions

1.  **Clone Repository**:
    If you haven't already, clone the repository to your local machine.
    ```bash
    git clone <repository_url>
    cd maestro-roshi # Or your repository's root folder
    ```

2.  **Navigate to Backend Directory**:
    ```bash
    cd backend
    ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Environment Configuration**:
    The backend requires configuration for the database connection and JWT secret.

    *   **Current Placeholders**:
        *   Database connection details (host, port, username, password, database name) are currently hardcoded as placeholders in `backend/src/app.module.ts` within the `TypeOrmModule.forRootAsync` configuration.
        *   The JWT secret is hardcoded as a placeholder in `backend/src/auth/auth.module.ts` within the `JwtModule.register` configuration.

    *   **Configuration for Local Setup**:
        For local development, you can manually update these placeholder values in the respective files.
        **Example values to configure**:
        *   Database Host (e.g., `localhost`)
        *   Database Port (e.g., `5432`)
        *   Database Username (e.g., `youruser`)
        *   Database Password (e.g., `yourpassword`)
        *   Database Name (e.g., `nestdb`) - *Ensure this database exists on your PostgreSQL server.*
        *   JWT Secret (e.g., `aVerySecureSecretKey`)

    *   **Recommended Practice (Future Improvement)**:
        For better security and flexibility, these configurations should be managed via environment variables (e.g., using a `.env` file and the `@nestjs/config` module). This has not been implemented yet.

5.  **Database Initialization**:
    *   The application uses TypeORM with the `synchronize: true` option enabled for development (in `backend/src/app.module.ts`).
    *   This means that when the backend application starts, TypeORM will attempt to automatically create the database schema (tables, columns, etc.) based on the entity definitions (e.g., `User` entity).
    *   **Important**: You must ensure that the database specified in the configuration (e.g., `nestdb`) exists on your PostgreSQL server and that the provided user credentials have the necessary permissions to connect and create tables.

### Running the Backend

*   **Development Mode (with watch and auto-reload)**:
    ```bash
    cd backend
    npm run start:dev
    ```
    The application will typically start on `http://localhost:3000`.

*   **Production Mode**:
    To run in production mode, you would first build the application:
    ```bash
    cd backend
    npm run build
    ```
    Then start the built application:
    ```bash
    npm start 
    # This usually runs: node dist/main
    ```

### API Endpoints Overview

The following are the main API endpoints implemented:

*   `POST /users/register`: Registers a new user.
    *   Body: `{ "email": "user@example.com", "password": "yourpassword" }`
*   `POST /auth/login`: Logs in an existing user and returns a JWT.
    *   Body: `{ "email": "user@example.com", "password": "yourpassword" }`
*   `POST /auth/logout`: Placeholder for logout (JWTs are typically handled client-side).
*   `GET /users/profile`: Retrieves the profile of the currently authenticated user (requires JWT).

### Running Tests

*   **Unit Tests**:
    ```bash
    cd backend
    npm test
    ```
*   **End-to-End (E2E) Tests**:
    ```bash
    cd backend
    npm run test:e2e
    ```
*   **Note on Test Execution**: There is a known issue in some environments where Jest might have trouble finding the `ts-jest` module, potentially leading to test failures. If you encounter this, further environment-specific Jest configuration might be needed.

---
(Instructions for overall project contribution, licensing, etc., can be added here.)
