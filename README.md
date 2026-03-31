# ConcurLite Engine

A corporate expense processing REST API built with Spring Boot, PostgreSQL, and JWT authentication. Inspired by SAP Concur's architecture, this project covers business logic, security, and observability.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 25 |
| Framework | Spring Boot 3.5.12 |
| Security | Spring Security + JWT (jjwt 0.12.6) |
| Persistence | Spring Data JPA + Hibernate |
| Database | PostgreSQL 18 |
| Build tool | Maven 3.9.14 |
| Logging | SLF4J + Logback + logstash-logback-encoder 8.0 |
| Testing | JUnit 5 + Mockito + AssertJ |
| Containerization | Docker + Docker Compose |
| Frontend | React 18 + Vite + Tailwind CSS v4 + Axios |
| Utilities | Lombok |

---

## Project Structure

```
com.concurlite.engine
├── domain          # Entities and enums (User, Expense, Role, Category, ExpenseStatus)
├── repository      # JPA interfaces (UserRepository, ExpenseRepository)
├── service         # Business logic (ExpenseService, AuthService)
├── controller      # REST endpoints (ExpenseController, AuthController)
├── dto             # Request/Response objects (ExpenseRequest, ExpenseResponse, AuthRequest, AuthResponse, ErrorResponse)
├── exception       # Global exception handler (GlobalExceptionHandler)
├── filter          # Request logging and correlation ID (RequestLoggingFilter)
└── security        # JWT (JwtUtil, JwtFilter, SecurityConfig, CustomUserDetailsService)
```

---

## Request Flow

```
Client
  └─► JWT Filter (validates Bearer token)
        └─► Controller (receives HTTP request)
              └─► Service (applies business rules)
                    └─► Repository (queries database)
                          └─► PostgreSQL
```

---

## Business Rules

### Audit Flag
Any expense with an `amount` above **R$ 5,000.00** is automatically flagged for audit compliance.

This is handled via `@PrePersist` in the `Expense` entity:

```java
@PrePersist
public void prePersist() {
    this.createdAt = LocalDateTime.now();
    this.status = ExpenseStatus.PENDING;
    this.auditFlag = this.amount.compareTo(new BigDecimal("5000.00")) > 0;
}
```

### Roles
| Role | Permissions |
|---|---|
| `EMPLOYEE` | Create and view expenses |
| `MANAGER` | Create, view, approve and reject expenses |

---

## Authentication

This API uses **JWT (JSON Web Token)** for stateless authentication.

- Tokens are issued on login via `POST /api/auth/login`
- Every protected request must include the token in the header:
  ```
  Authorization: Bearer <token>
  ```
- JWT is stateless — no session is stored on the server, which supports horizontal scaling in microservice environments

---

## API Endpoints

> All protected endpoints require the header:
> ```
> Authorization: Bearer <token>
> ```
> Obtain the token via `POST /api/auth/login`.

---

### Auth

#### POST /api/auth/login
Authenticates a user and returns a JWT token.

- **Access:** Public
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/login`
- **Body (raw JSON):**
```json
{
  "email": "manager@concurlite.com",
  "password": "password123"
}
```
- **Success response — 200 OK:**
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "email": "manager@concurlite.com",
  "role": "MANAGER"
}
```
- **Error response — 401 Unauthorized:**
```json
{
  "timestamp": "2026-03-29T17:03:52",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "path": "/api/auth/login"
}
```

> **Available users:**
> - `manager@concurlite.com` / `password123` → role: `MANAGER`
> - `employee@concurlite.com` / `password123` → role: `EMPLOYEE`

---

### Expenses

#### POST /api/expenses
Creates a new expense. The `auditFlag` is automatically set to `true` if `amount` exceeds R$ 5,000.00.

- **Access:** Authenticated (EMPLOYEE or MANAGER)
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/expenses`
- **Authorization:** Bearer Token
- **Body (raw JSON):**
```json
{
  "description": "Flight to São Paulo",
  "amount": 6500.00,
  "category": "TRAVEL",
  "userId": 1
}
```
- **Success response — 201 Created:**
```json
{
  "id": 1,
  "description": "Flight to São Paulo",
  "amount": 6500.00,
  "category": "TRAVEL",
  "status": "PENDING",
  "auditFlag": true,
  "createdAt": "2026-03-29T17:03:52",
  "userName": "Admin Manager"
}
```
- **Error response — 400 Bad Request (validation):**
```json
{
  "timestamp": "2026-03-29T17:03:52",
  "status": 400,
  "error": "Bad Request",
  "message": "Description is required, Amount must be positive",
  "path": "/api/expenses"
}
```
- **Error response — 404 Not Found (user not found):**
```json
{
  "timestamp": "2026-03-29T17:03:52",
  "status": 404,
  "error": "Not Found",
  "message": "User not found with ID: 99",
  "path": "/api/expenses"
}
```

> **Available categories:** `TRAVEL`, `FOOD`, `ACCOMMODATION`

---

#### GET /api/expenses
Returns all expenses in the database.

- **Access:** Authenticated (EMPLOYEE or MANAGER)
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/expenses`
- **Authorization:** Bearer Token
- **Body:** None
- **Success response — 200 OK:**
```json
[
  {
    "id": 1,
    "description": "Flight to São Paulo",
    "amount": 6500.00,
    "category": "TRAVEL",
    "status": "APPROVED",
    "auditFlag": true,
    "createdAt": "2026-03-29T17:03:52",
    "userName": "Admin Manager"
  },
  {
    "id": 2,
    "description": "Team lunch",
    "amount": 180.00,
    "category": "FOOD",
    "status": "PENDING",
    "auditFlag": false,
    "createdAt": "2026-03-29T17:10:00",
    "userName": "John Employee"
  }
]
```

---

#### GET /api/expenses/{id}
Returns a single expense by ID.

- **Access:** Authenticated (EMPLOYEE or MANAGER)
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/expenses/1`
- **Authorization:** Bearer Token
- **Body:** None
- **Success response — 200 OK:**
```json
{
  "id": 1,
  "description": "Flight to São Paulo",
  "amount": 6500.00,
  "category": "TRAVEL",
  "status": "PENDING",
  "auditFlag": true,
  "createdAt": "2026-03-29T17:03:52",
  "userName": "Admin Manager"
}
```
- **Error response — 404 Not Found:**
```json
{
  "timestamp": "2026-03-29T17:03:52",
  "status": 404,
  "error": "Not Found",
  "message": "Expense not found with ID: 999",
  "path": "/api/expenses/999"
}
```

---

#### PATCH /api/expenses/approve/{id}
Approves a pending expense. Only accessible by users with the `MANAGER` role.

- **Access:** MANAGER only
- **Method:** `PATCH`
- **URL:** `http://localhost:8080/api/expenses/approve/1`
- **Authorization:** Bearer Token (MANAGER token)
- **Body:** None
- **Success response — 200 OK:**
```json
{
  "id": 1,
  "description": "Flight to São Paulo",
  "amount": 6500.00,
  "category": "TRAVEL",
  "status": "APPROVED",
  "auditFlag": true,
  "createdAt": "2026-03-29T17:03:52",
  "userName": "Admin Manager"
}
```
- **Error response — 403 Forbidden (wrong role):**
```json
{
  "timestamp": "2026-03-29T17:03:52",
  "status": 403,
  "error": "Forbidden",
  "message": "You do not have permission to perform this action",
  "path": "/api/expenses/approve/1"
}
```
- **Error response — 404 Not Found:**
```json
{
  "timestamp": "2026-03-29T17:03:52",
  "status": 404,
  "error": "Not Found",
  "message": "Expense not found with ID: 999",
  "path": "/api/expenses/approve/999"
}
```

---

#### PATCH /api/expenses/reject/{id}
Rejects a pending expense. Only accessible by users with the `MANAGER` role.

- **Access:** MANAGER only
- **Method:** `PATCH`
- **URL:** `http://localhost:8080/api/expenses/reject/1`
- **Authorization:** Bearer Token (MANAGER token)
- **Body:** None
- **Success response — 200 OK:**
```json
{
  "id": 1,
  "description": "Flight to São Paulo",
  "amount": 6500.00,
  "category": "TRAVEL",
  "status": "REJECTED",
  "auditFlag": true,
  "createdAt": "2026-03-29T17:03:52",
  "userName": "Admin Manager"
}
```
- **Error response — 403 Forbidden (wrong role):**
```json
{
  "timestamp": "2026-03-29T17:03:52",
  "status": 403,
  "error": "Forbidden",
  "message": "You do not have permission to perform this action",
  "path": "/api/expenses/reject/1"
}
```
- **Error response — 404 Not Found:**
```json
{
  "timestamp": "2026-03-29T17:03:52",
  "status": 404,
  "error": "Not Found",
  "message": "Expense not found with ID: 999",
  "path": "/api/expenses/reject/999"
}
```

---

### Quick reference

| Method | Endpoint | Access | Body required |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Yes |
| POST | `/api/expenses` | Authenticated | Yes |
| GET | `/api/expenses` | Authenticated | No |
| GET | `/api/expenses/{id}` | Authenticated | No |
| PATCH | `/api/expenses/approve/{id}` | MANAGER only | No |
| PATCH | `/api/expenses/reject/{id}` | MANAGER only | No |

---

## How to Run Locally

### Prerequisites

- Java 21+
- Maven 3.9+
- PostgreSQL 15+

### 1. Create the database

```sql
CREATE DATABASE concurlite;
CREATE USER concurlite_user WITH PASSWORD 'concurlite123';
GRANT ALL PRIVILEGES ON DATABASE concurlite TO concurlite_user;
GRANT ALL ON SCHEMA public TO concurlite_user;
```

### 2. Configure the application

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/concurlite
spring.datasource.username=concurlite_user
spring.datasource.password=concurlite123
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

server.port=8080
spring.application.name=concurlite-engine
```

### 3. Run the application

```bash
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`.

### 4. Seed initial users

Generate a BCrypt hash for your password by running `PasswordGenerator.java`, then insert into the database:

```sql
INSERT INTO users (name, email, password, role) VALUES
  ('Admin Manager', 'manager@concurlite.com', '<bcrypt_hash>', 'MANAGER'),
  ('John Employee', 'employee@concurlite.com', '<bcrypt_hash>', 'EMPLOYEE');
```

---

## Entities

### User
| Field | Type | Description |
|---|---|---|
| id | Long | Primary key |
| name | String | Full name |
| email | String | Unique email (used as username) |
| password | String | BCrypt-encoded password |
| role | Role | `EMPLOYEE` or `MANAGER` |

### Expense
| Field | Type | Description |
|---|---|---|
| id | Long | Primary key |
| description | String | Expense description |
| amount | BigDecimal | Expense amount |
| category | Category | `TRAVEL`, `FOOD`, or `ACCOMMODATION` |
| status | ExpenseStatus | `PENDING`, `APPROVED`, or `REJECTED` |
| auditFlag | boolean | Auto-set to `true` if amount > R$5,000 |
| createdAt | LocalDateTime | Auto-set on creation |
| user | User | The employee who submitted the expense |

---

## Exception Handling

All exceptions are handled centrally by `GlobalExceptionHandler` (`@RestControllerAdvice`), ensuring every error returns a consistent JSON contract — no stack traces are exposed to the client.

### Error response format

```json
{
  "timestamp": "2026-03-27T11:24:29",
  "status": 404,
  "error": "Not Found",
  "message": "Expense not found with ID: 999",
  "path": "/api/expenses/999"
}
```

### Handled exceptions

| Exception | HTTP Status | Scenario |
|---|---|---|
| `ResourceNotFoundException` | 404 | Entity not found in database |
| `BusinessException` | 400 | Business rule violation |
| `MethodArgumentNotValidException` | 400 | `@Valid` field validation failure |
| `BadCredentialsException` | 401 | Wrong email or password |
| `AccessDeniedException` | 403 | User lacks required role |
| `Exception` (fallback) | 500 | Unexpected server error |

### Domain exceptions

| Class | Usage |
|---|---|
| `ResourceNotFoundException` | Thrown when a `User` or `Expense` is not found by ID |
| `BusinessException` | Thrown when a business rule is violated (e.g. invalid state transition) |

### Design rationale

- Controllers focus on the **happy path** only — no `try-catch` blocks
- Exception handlers maintain **separation of concerns**
- A single file controls the entire error contract — easy to maintain and evolve

---

## Observability

### Structured JSON Logs

All logs are exported in JSON format using the `logstash-logback-encoder` library, configured via `logback-spring.xml`. This makes every log line directly indexable by tools like Splunk, Datadog, and ELK Stack.

Every log entry contains the following fields:

| Field | Description |
|---|---|
| `@timestamp` | When the event occurred (ISO 8601) |
| `message` | The log message written with `@Slf4j` |
| `logger_name` | The class that generated the log |
| `thread_name` | The thread that processed the request |
| `level` | Log severity (`INFO`, `WARN`, `ERROR`) |
| `correlationId` | Unique ID that ties all logs from the same request together |

**Example log output:**
```json
{
  "@timestamp": "2026-03-29T17:03:52.447-03:00",
  "@version": "1",
  "message": "Login successful for email: manager@concurlite.com",
  "logger_name": "com.concurlite.engine.service.AuthService",
  "thread_name": "http-nio-8080-exec-3",
  "level": "INFO",
  "level_value": 20000,
  "correlationId": "a3dde6e4-26bd-4419-8953-1a7a4422b4ea"
}
```

### Correlation ID

Every incoming request is assigned a unique `correlationId` (UUID) by `RequestLoggingFilter`, stored in the MDC (Mapped Diagnostic Context) and automatically appended to every log line generated during that request.

This allows tracing the full journey of a single request across all layers:

```
correlationId = "a3dde6e4-..."

INFO - Authenticated request | user: manager@concurlite.com
INFO - PATCH /api/expenses/approve/1 - start
INFO - Approving expense ID: 1
INFO - PATCH /api/expenses/approve/1 - end
```

Filtering by `correlationId` in Splunk or Datadog returns the complete trace of that request — from the moment it entered port 8080 to the database response.

### Logback configuration

```xml
<!-- src/main/resources/logback-spring.xml -->
<configuration>
    <appender name="jsonConsole" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder" />
    </appender>

    <root level="INFO">
        <appender-ref ref="jsonConsole" />
    </root>
</configuration>
```

### Log levels used

| Level | When |
|---|---|
| `INFO` | Normal flow — request start/end, successful operations |
| `WARN` | Expected failures — resource not found, validation errors, access denied |
| `ERROR` | Unexpected failures — unhandled exceptions, system errors |

---

## Frontend

The project includes a modern React frontend that consumes the REST API, managing the JWT token on the client side and rendering the interface based on the authenticated user's role.

### Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| HTTP client | Axios (with request interceptors) |
| Icons | Lucide React |
| Auth | JWT stored in localStorage |

---

### Project structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth.jsx        # Login and registration screen
│   │   └── Dashboard.jsx   # Expense management dashboard
│   ├── services/
│   │   └── api.js          # Axios instance with JWT interceptor
│   ├── App.jsx             # Root component with auth state management
│   └── index.css           # Tailwind CSS directives
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

### Architecture

The frontend runs as a standalone Single Page Application (SPA) on port `5173`, communicating with the Spring Boot API on port `8080` via JSON. This separation allows independent scaling and deployment of each layer.

```
Browser (React — port 5173)
        │
        │  HTTP + Bearer Token (JWT)
        ▼
Spring Boot API (port 8080)
        │
        ▼
   PostgreSQL
```

The Axios interceptor automatically attaches the JWT to every request:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### Authentication flow

1. User fills in the login or registration form in `Auth.jsx`
2. On login, the API returns a JWT token, email and role
3. These values are stored in `localStorage`
4. `App.jsx` reads the stored token on load — if present, shows the Dashboard directly
5. On logout, `localStorage` is cleared and the login screen is shown again

---

### Role-based UI

The Dashboard renders different controls based on the authenticated user's role:

| Role | Can see expenses | Can submit expenses | Can approve / reject |
|---|---|---|---|
| `EMPLOYEE` | ✅ | ✅ | ❌ |
| `MANAGER` | ✅ | ✅ | ✅ |

Approve and Reject buttons only appear for `MANAGER` users and only on `PENDING` expenses. The role check happens on the frontend for UX — but authorization is always enforced on the backend via Spring Security.

---

### Running the frontend

```bash
cd frontend
npm install
npm run dev
```

Access the UI at `http://localhost:5173`.

> The Spring Boot backend must be running on port `8080` before starting the frontend.

---

### CORS configuration

Because the frontend (port `5173`) and backend (port `8080`) run on different origins, CORS is configured in `SecurityConfig.java`:

```java
configuration.setAllowedOrigins(List.of("http://localhost:5173"));
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
```

Preflight `OPTIONS` requests are explicitly permitted in the security filter chain to allow the browser handshake to complete before the actual request is sent.

---

### User registration

New users can be registered via the UI or directly via the API:

```json
POST /api/auth/register

{
  "name": "Marcelo Dev",
  "email": "marcelo@test.com",
  "password": "password123",
  "role": "MANAGER"
}
```

Passwords are BCrypt-encoded before being stored. Duplicate emails return a `400 Bad Request`.

---

## Testing

This project follows the **Testing Pyramid**: 70% unit tests, 20% integration tests, 10% end-to-end.

### Running all tests

```bash
mvn test
```

---

### Unit Tests — ExpenseServiceTest

Located at `src/test/java/com/concurlite/engine/service/ExpenseServiceTest.java`

Uses `@ExtendWith(MockitoExtension.class)` to isolate the service layer from the database. The repository is mocked with Mockito — no real database connection is made.

**What is tested:**

`shouldCalculateAuditFlagCorrectly` — uses `@ParameterizedTest` with `@CsvSource` to validate the audit flag rule across multiple boundary values:

| Amount | Expected auditFlag | Reason |
|---|---|---|
| `6000.00` | `true` | Above R$5,000 |
| `5000.00` | `false` | Exactly R$5,000 — not above |
| `100.00` | `false` | Below R$5,000 |
| `0.01` | `false` | Minimum value |

`shouldThrowExceptionWhenUserNotFound` — validates that `ResourceNotFoundException` is thrown when a non-existent user ID is provided.

**Why this matters:**
- Tests run without a database — ultra fast, suitable for CI/CD pipelines
- `@ParameterizedTest` avoids duplicated test code for boundary conditions
- Tests the **sad path** (exception scenarios), not just the happy path

---

### Integration Tests — ExpenseRepositoryTest

Located at `src/test/java/com/concurlite/engine/repository/ExpenseRepositoryTest.java`

Uses `@DataJpaTest` + `@AutoConfigureTestDatabase(replace = NONE)` to boot only the JPA layer and connect to the real PostgreSQL instance.

**What is tested:**

`shouldSaveAndFindExpense` — verifies that an `Expense` is correctly persisted and its generated ID is not null.

`shouldFindByStatusAndAmount` — verifies that the custom JPQL query `findByStatusAndMinAmount` returns the correct result set.

**Test isolation strategy:**

Each test starts with a clean state via `@BeforeEach`:

```java
@BeforeEach
void setUp() {
    expenseRepository.deleteAll();
    userRepository.deleteAll();
    // creates a fresh user for the test
}
```

This prevents data pollution between test runs — a critical practice for reliable integration tests.

**Why this matters:**
- Validates that JPA entity mappings (`@Entity`, `@ManyToOne`, `@Column`) are correct
- Validates that custom JPQL queries return the expected results
- Catches schema mismatches before they reach production

---

## Docker

The application is fully containerized and can be run without any local Java or PostgreSQL installation.

### Prerequisites

- Docker Desktop running

### Run with Docker Compose

```bash
docker-compose up --build
```

This single command will:
1. Pull the `postgres:18-alpine` image
2. Build the Spring Boot application image using the multi-stage `Dockerfile`
3. Start the database container (`concurlite-db`)
4. Start the application container (`concurlite-app`)
5. Make the API available at `http://localhost:8080`

### Stop the containers

```bash
docker-compose down
```

---

### Dockerfile — multi-stage build

```dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Stage 2: Run (lightweight image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

The build stage contains the full JDK and Maven. The final image contains only the JRE and the compiled `.jar`, making it significantly smaller and more secure.

---

### docker-compose.yml

```yaml
services:
  db:
    image: postgres:18-alpine
    container_name: concurlite-db
    environment:
      POSTGRES_DB: concurlite
      POSTGRES_USER: concurlite_user
      POSTGRES_PASSWORD: concurlite123
    ports:
      - "5432:5432"

  app:
    build: .
    container_name: concurlite-app
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/concurlite
      SPRING_DATASOURCE_USERNAME: concurlite_user
      SPRING_DATASOURCE_PASSWORD: concurlite123
    depends_on:
      - db
```

Note that the database URL uses `db` (the service name) instead of `localhost`. Docker creates an internal network where containers communicate by service name.

---

## Roadmap

- [x] JWT Authentication
- [x] Expense CRUD
- [x] Audit flag rule (amount > R$5,000)
- [x] Role-based authorization (MANAGER / EMPLOYEE)
- [x] Global exception handler (@RestControllerAdvice)
- [x] Structured JSON logs (logstash-logback-encoder)
- [x] Correlation ID per request (MDC)
- [x] Unit tests with JUnit 5 + Mockito (@ParameterizedTest)
- [x] Integration tests (@DataJpaTest + PostgreSQL)
- [x] Dockerfile (multi-stage build)
- [x] Docker Compose (app + database)
- [x] React frontend (Login, Registration, Dashboard)
- [x] Role-based UI (Manager sees approve/reject buttons)
- [x] CORS configuration for decoupled frontend/backend
- [ ] Environment variables (.env)
- [ ] Testcontainers for isolated integration tests
