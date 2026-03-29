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

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate and receive JWT token |

**Request body:**
```json
{
  "email": "manager@concurlite.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOi...",
  "email": "manager@concurlite.com",
  "role": "MANAGER"
}
```

---

### Expenses

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/expenses` | Authenticated | Create a new expense |
| GET | `/api/expenses` | Authenticated | List all expenses |
| GET | `/api/expenses/{id}` | Authenticated | Get expense by ID |
| PATCH | `/api/expenses/approve/{id}` | MANAGER only | Approve an expense |
| PATCH | `/api/expenses/reject/{id}` | MANAGER only | Reject an expense |

**Create expense — request body:**
```json
{
  "description": "Flight to São Paulo",
  "amount": 6500.00,
  "category": "TRAVEL",
  "userId": 1
}
```

**Response:**
```json
{
  "id": 1,
  "description": "Flight to São Paulo",
  "amount": 6500.00,
  "category": "TRAVEL",
  "status": "PENDING",
  "auditFlag": true,
  "createdAt": "2026-03-26T09:05:47.297",
  "userName": "Admin Manager"
}
```

**Available categories:** `TRAVEL`, `FOOD`, `ACCOMMODATION`

**Expense statuses:** `PENDING`, `APPROVED`, `REJECTED`

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

## Roadmap

- [x] JWT Authentication
- [x] Expense CRUD
- [x] Audit flag rule (amount > R$5,000)
- [x] Role-based authorization (MANAGER / EMPLOYEE)
- [x] Global exception handler (@RestControllerAdvice)
- [x] Structured JSON logs (logstash-logback-encoder)
- [x] Correlation ID per request (MDC)
- [ ] Environment variables (.env)
- [ ] Unit tests with JUnit 5 + Mockito
- [ ] Integration tests
- [ ] Dockerfile (multi-stage build)
- [ ] Docker Compose (app + database)
