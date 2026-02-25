# Task Management System - Full Stack Assessment <!-- omit in toc -->

## Table of Contents <!-- omit in toc -->

- [Prerequisites](#prerequisites)
  - [Node](#node)
  - [nx](#nx)
- [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Access the Application](#access-the-application)
  - [Test Credentials](#test-credentials)
- [Project Structure](#project-structure)
- [🗄️ Database Setup](#️-database-setup)
  - [SQLite Configuration](#sqlite-configuration)
  - [Seeding the Database](#seeding-the-database)
- [🏗️ Architecture](#️-architecture)
  - [Technology Stack](#technology-stack)
  - [Design Decisions](#design-decisions)
- [Data Model](#data-model)
  - [Entity Relationship Diagram](#entity-relationship-diagram)
  - [Entities](#entities)
- [Access Control Implementation](#access-control-implementation)
  - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
    - [Role Hierarchy](#role-hierarchy)
    - [Permission Matrix](#permission-matrix)
  - [JWT Authentication Flow](#jwt-authentication-flow)
  - [Organization Hierarchy Access](#organization-hierarchy-access)
- [📡 API Documentation](#-api-documentation)
  - [Base URL](#base-url)
  - [Authentication](#authentication)
    - [POST /auth/login](#post-authlogin)
    - [POST /auth/register](#post-authregister)
  - [Tasks](#tasks)
    - [POST /tasks](#post-tasks)
    - [GET /tasks](#get-tasks)
    - [PUT /tasks/:id](#put-tasksid)
    - [DELETE /tasks/:id](#delete-tasksid)
  - [Error Responses](#error-responses)
- [Testing](#testing)
  - [Running Tests](#running-tests)
  - [Test Coverage](#test-coverage)
  - [Key Test Scenarios](#key-test-scenarios)
- [Future Considerations](#future-considerations)
  - [Production-Ready Security](#production-ready-security)
  - [Advanced Features](#advanced-features)
- [Known Issues](#known-issues)


## Prerequisites

### Node

Ensure that your machine has Node (and npm) installed by checking with the following command:

```bash
node -v
npm -v
```

If one of them output an error, then install Node by either using [`nvm`](https://github.com/nvm-sh/nvm) or from the standalone binaries, both instructions can be found [here](https://nodejs.org/en/download).

### nx

If `nx` has not yet been installed, then run the following command:

```bash
npm install -g nx
```

> Secure Task Management System with Role-Based Access Control (RBAC)

## Quick Start

### Installation

1. Install dependencies.

    ```bash
    npm install
    ```

2. Set up environment variables. Only change the `JWT_SECRET` field with your secret key.
    ```bash
    cp .env.example .env
    ```

3. Seed the database with test data.
    ```bash
    npm run seed
    ```

4. Start the backend with:
    ```bash
    npx nx serve api
    ```

5. In a new terminal at the same directory, start the frontend with:
    ```bash
    npx nx serve dashboard
    ```

### Access the Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000

### Test Credentials

| Role   | Email              | Password    |
|--------|--------------------|-------------|
| Owner  | owner@acme.com     | password123 |
| Admin  | admin@acme.com     | password123 |
| Viewer | viewer@acme.com    | password123 |

---

## Project Structure

```
task-management/
├── apps/
│   ├── api/              # NestJS Backend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── auth/         # Authentication module
│   │   │   │   ├── tasks/        # Tasks module  
│   │   │   │   └── entities/     # TypeORM entities
│   │   │   ├── seed.ts           # Database seeding
│   │   │   └── main.ts
│   │   └── .env
│   │
│   └── dashboard/        # Angular Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── pages/        # Route components
│       │   │   ├── services/     # API services
│       │   │   ├── guards/       # Auth guards
│       │   │   └── interceptors/ # HTTP interceptors
│       │   └── styles.css
│       └── tailwind.config.js
│
├── libs/
│   ├── data/            # Shared TypeScript interfaces
│   │   └── src/lib/
│   │       └── data.ts  # IUser, ITask, Role, TaskStatus
│   │
│   └── auth/            # Reusable RBAC logic (future)
│
├── .env                 # Environment variables
└── data.db              # SQLite database (auto-generated)
```

---

## 🗄️ Database Setup

### SQLite Configuration

The application uses SQLite for ease of development and assessment. The database file `data.db` is automatically created when you run the seed script.

**Location**: Root directory (`./data.db`)

**Auto-sync**: TypeORM is configured with `synchronize: true` for development, which automatically creates tables based on entities.

### Seeding the Database

The seed script populates the database with:
- 2 organizations (parent-child hierarchy)
- 3 users (Owner, Admin, Viewer)
- 4 sample tasks

```bash
npm run seed
```

**What gets created:**
- **Organizations**: 
  - Acme Corporation (parent)
  - Acme Engineering (child)
- **Users**: owner@acme.com, admin@acme.com, viewer@acme.com
- **Tasks**: Sample tasks across different statuses and categories

---

## 🏗️ Architecture

### Technology Stack

**Backend:**
- NestJS - TypeScript framework
- TypeORM - ORM with SQLite
- Passport JWT - Authentication
- bcrypt - Password hashing
- class-validator - DTO validation

**Frontend:**
- Angular 21 - Modern component-based framework
- Signals - Reactive state management
- Tailwind CSS - Utility-first styling
- inject() API - Modern dependency injection

**Shared:**
- NX - Monorepo tooling
- TypeScript - Type safety across stack

### Design Decisions

1. **Monorepo with NX**: Shared types between frontend and backend ensure type safety
2. **SQLite**: Simplified deployment and assessment review
3. **JWT Authentication**: Stateless, scalable authentication
4. **Angular Signals**: Modern reactive state management (Angular 16+)
5. **Standalone Components**: Angular's recommended approach (Angular 14+)

---

## Data Model

### Entity Relationship Diagram

```
Organization (1) ──< (N) Organization (self-reference: parent-child)
     │
     │ (1:N)
     ▼
    User
     │
     │ (1:N)
     ▼
    Task
```

### Entities

**User**
- `id`: UUID primary key
- `email`: Unique email address
- `password`: Bcrypt hashed (10 rounds)
- `role`: OWNER | ADMIN | VIEWER
- `organizationId`: Foreign key to Organization

**Organization**
- `id`: UUID primary key
- `name`: Organization name
- `parentId`: Self-referencing FK (nullable)

**Task**
- `id`: UUID primary key
- `title`: Task title
- `description`: Detailed description
- `status`: TODO | IN_PROGRESS | DONE
- `category`: Optional categorization
- `organizationId`: FK to Organization
- `createdById`: FK to User
- `createdAt`: Auto-generated timestamp
- `updatedAt`: Auto-updated timestamp

---

## Access Control Implementation

### Role-Based Access Control (RBAC)

#### Role Hierarchy

```
OWNER (Highest Privilege)
  ├── Access to all tasks in organization hierarchy
  ├── Create, Read, Update, Delete tasks
  └── View audit logs (future feature)

ADMIN (Medium Privilege)
  ├── Access to tasks in same organization only
  ├── Create, Read, Update, Delete tasks
  └── View audit logs (future feature)

VIEWER (Lowest Privilege)
  ├── Can only see tasks they created
  ├── Create tasks
  └── Read-only for own tasks
```

#### Permission Matrix

| Action          | Owner | Admin | Viewer |
|-----------------|-------|-------|--------|
| Create Task     | ✅    | ✅    | ✅     |
| View All Tasks  | ✅ *  | ✅ ** | ❌     |
| View Own Tasks  | ✅    | ✅    | ✅     |
| Edit Any Task   | ✅ *  | ✅ ** | ❌     |
| Delete Any Task | ✅ *  | ✅ ** | ❌     |

\* Owner sees/edits tasks in org hierarchy  
\*\* Admin sees/edits tasks in same org only

### JWT Authentication Flow

```
1. User submits credentials
   ↓
2. Backend validates with bcrypt
   ↓
3. Generate JWT with payload:
   {
     sub: userId,
     email: email,
     role: role,
     organizationId: orgId
   }
   ↓
4. Frontend stores in localStorage
   ↓
5. HTTP interceptor adds to all requests:
   Authorization: Bearer <token>
   ↓
6. JwtStrategy validates and extracts user
   ↓
7. Guards check permissions
   ↓
8. Service validates org hierarchy access
```

### Organization Hierarchy Access

The system implements cascading access control:

```typescript
// Owner in parent org can access child org tasks
isInOrgHierarchy(childOrgId, parentOrgId) {
  if (childOrgId === parentOrgId) return true;
  
  org = findOrganization(childOrgId);
  if (org.parentId) {
    return isInOrgHierarchy(org.parentId, parentOrgId);
  }
  return false;
}
```

**Example:**
- Owner in "Acme Corporation" can access tasks in "Acme Engineering"
- Admin in "Acme Engineering" cannot access tasks in "Acme Corporation"

---

## 📡 API Documentation

### Base URL
`http://localhost:3000/api`

### Authentication

#### POST /auth/login
Authenticate user and receive JWT token

**Request:**
```json
{
  "email": "owner@acme.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "owner@acme.com",
    "role": "OWNER",
    "organizationId": "uuid"
  }
}
```

#### POST /auth/register
Register new user

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword",
  "role": "VIEWER",
  "organizationId": "uuid"
}
```

**Response:** Same as login

### Tasks

All task endpoints require `Authorization: Bearer <token>` header

#### POST /tasks
Create a new task

**Request:**
```json
{
  "title": "Implement feature X",
  "description": "Add authentication to dashboard",
  "status": "TODO",
  "category": "Work"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Implement feature X",
  "description": "Add authentication to dashboard",
  "status": "TODO",
  "category": "Work",
  "organizationId": "uuid",
  "createdById": "uuid",
  "createdAt": "2025-02-23T10:00:00Z",
  "updatedAt": "2025-02-23T10:00:00Z"
}
```

#### GET /tasks
Retrieve all accessible tasks (scoped by role and org)

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Task 1",
    "description": "Description",
    "status": "IN_PROGRESS",
    "category": "Work",
    "organizationId": "uuid",
    "createdById": "uuid",
    "createdAt": "2025-02-23T09:00:00Z",
    "updatedAt": "2025-02-23T09:30:00Z"
  }
]
```

#### PUT /tasks/:id
Update a task (Admin and Owner only)

**Request:**
```json
{
  "title": "Updated title",
  "status": "DONE"
}
```

**Response:** Updated task object

#### DELETE /tasks/:id
Delete a task (Admin and Owner only)

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

### Error Responses

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Viewers cannot edit tasks"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Task not found"
}
```

---

## Testing

### Running Tests

```bash
# Backend unit tests
npx nx test api

# Frontend unit tests  
npx nx test dashboard

# All tests
npx nx run-many -t test

# With coverage
npx nx test api --coverage
npx nx test dashboard --coverage
```

### Test Coverage

**Backend:**
- ✅ Authentication service (login, register, validation)
- ✅ RBAC logic (role-based access checks)
- ✅ Task service (CRUD operations, permissions)
- ✅ Organization hierarchy access

**Frontend:**
- ✅ Authentication service
- ✅ Task service
- ✅ HTTP interceptor
- ✅ Route guards

### Key Test Scenarios

1. **Authentication**
   - Valid login returns JWT
   - Invalid credentials rejected
   - Registration creates user

2. **RBAC**
   - Owner accesses tasks in org hierarchy
   - Admin limited to same org
   - Viewer sees only own tasks
   - Viewers cannot edit/delete

3. **Task Operations**
   - Create task assigns to user's org
   - Update requires proper permissions
   - Delete requires proper permissions

---

## Future Considerations

### Production-Ready Security

The following are ideas on what to do for security when this project is actually used in production.

1. **Using Third-party Authentication Service**
   - Maintaining an authentication service can be tricky with improper password hashing, proper key rotations, potential liability, etc
   - Would recommend something like Auth0 or Amazon Cognito (if already using AWS). User information can be handled in those services too

2. **Third-party Secret Storage**
   - If storing JWT secrets, storing in plaintext in an env file is not great
   - Use AWS Secrets Manager, Hashicorp Vault, 1Password, etc.

3. **HttpOnly Cookies**
   - Set HTTPOnly cookie containing access token on login if using custom JWT authenticator

4. **Rate Limiting**
   - Per-endpoint rate limits
   - Distributed rate limiting with Redis

5. **HTTPS**
   - SSL/TLS encryption to protect any sensitive data as best as possible
   - Important if handling passwords

6. **RSA Encryption instead of HMAC**
   - Allows us to migrate to a third-party authentication service if we need to, as they all use RSA
   - No one point of failure with just one key for signing and verifying with HMAC

### Advanced Features

The following would be features that I would want to implement if given the chance.

1. **Audit Logging**
   - Complete CRUD operation logging
   - User action history
   - Compliance reports
   - Could be provided by third party service

2. **Task Features**
   - Task assignment to users
   - File attachments
   - Comments and collaboration
   - Due dates and reminders
   - Email notifications

3. **Performance**
   - Database indexing
   - Query optimization
   - Pagination
   - Caching layer

4. **Database migration**
   - Instead of using SQLite where WRITEs can get very costly, use Postgres instead
   - Besides a few QoL features, Postgres can be horizontally scaled if needed unlike SQLite

5. **Deployment**
   - Docker containerization
   - PostgreSQL for production
   - CI/CD pipeline
   - Monitoring and logging

---

## Known Issues

- Dashboard tests display a TypeScript error `Cannot find module '@angular/core/testing'` during execution, but tests run successfully. This is a known module resolution issue between Angular 21, NX 22, and jest-preset-angular v16 (see [NX issue #33777](https://github.com/nrwl/nx/issues/33777)). The error is cosmetic - all test functionality works correctly and assertions pass.