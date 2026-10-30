# ResolveNow Service Desk — Enterprise Issue Escalation & Service Desk Management System (PS027)

ResolveNow Service Desk is an enterprise-grade ticket management and issue escalation platform designed for logging customer grievances, assigning tickets to specialized departments, tracking end-to-end resolution lifecycles with configurable SLAs, providing real-time status visibility, and dispatching progress notifications.

---

## 1. Architecture Overview

ResolveNow is architected as a Service-Oriented Architecture (SOA) consisting of Spring Boot microservices, Spring Cloud API Gateway, Netflix Eureka for dynamic service discovery, a React + Vite frontend, and a shared PostgreSQL relational database.

```
                  +-----------------------------------+
                  |         React + Vite Client       |
                  |       (http://localhost:5173)     |
                  +-----------------+-----------------+
                                    |
                            HTTP / JWT Bearer
                                    v
                  +-----------------------------------+
                  |      Spring Cloud API Gateway     |
                  |       (http://localhost:8080)     |
                  +-----+---------+---------+---------+
                        |         |         |         |
          +-------------+         |         |         +-------------+
          |                       |         |                       |
          v                       v         v                       v
+------------------+     +-----------+ +------------+     +------------------+
|   Auth Service   |     | Complaint | | Assignment |     |   Notification   |
|     (Port 8081)  |     |  Service  | |  Service   |     |     Service      |
|                  |     |(Port 8082)| |(Port 8083) |     |   (Port 8084)    |
+--------+---------+     +-----+-----+ +-----+------+     +--------+---------+
         |                     |             |                     |
         +---------------------+------+------+---------------------+
                                      |
                     Eureka Service Registry (Port 8761)
                                      |
                     PostgreSQL Database (Port 5433)
```

---

## 2. Microservice Responsibilities & Ports

| Service Name | Port | Description & Responsibilities |
|---|---|---|
| **Eureka Server** | `8761` | Netflix Eureka service discovery server. Maintains registry of all alive microservices. |
| **API Gateway** | `8080` | Spring Cloud Gateway. Entry point for all client requests; handles CORS, route forwarding via Eureka (`lb://`), and edge JWT authentication. |
| **Auth Service** | `8081` | User registration, authentication, BCrypt password hashing, JWT token issuance, and user profile retrieval (`/api/auth/me`). |
| **Complaint Service** | `8082` | Complaint CRUD, priority management (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), automated SLA calculation (`slaDeadline`), manual escalation (`/escalate`), timeline audit logging, and aggregated metrics (`/stats`). |
| **Assignment Service** | `8083` | Technician and department ticket dispatching, assignment status transitions (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `REASSIGNED`), timestamp tracking (`assignedAt`, `updatedAt`), and agent workloads. |
| **Notification Service**| `8084` | Event-driven alert delivery (`COMPLAINT_CREATED`, `COMPLAINT_ASSIGNED`, `COMPLAINT_STATUS_CHANGED`, `COMPLAINT_ESCALATED`), unread count calculation, and user-isolated read operations. |
| **Frontend** | `5173` | React 18 SPA built with Vite. Responsive dashboard, ticket management tables, SLA indicators, escalation dialogs, and real-time toast feedback. |

---

## 3. Prerequisites & Environment Configuration

### Prerequisites
- **Java Development Kit (JDK)**: Version 17 or higher
- **Node.js**: Version 18.x or higher, with `npm`
- **PostgreSQL**: Version 15+ (default configured on port `5433`)
- **Git**

### Environment Configuration
The backend services use environment variables with fallback defaults in `application.properties`:

| Variable | Description | Default Development Value |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC Connection URL | `jdbc:postgresql://localhost:5433/resolvenow_db` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `9010` |
| `JWT_SECRET` | Base64-encoded HMAC-SHA secret (256-bit min) | Defined in `application.properties` (or custom override) |
| `EUREKA_SERVER_URL`| Eureka registry address | `http://localhost:8761/eureka/` |

---

## 4. Database Setup

Ensure PostgreSQL is running on port `5433` (or set `DB_URL` accordingly) and the database exists:

```sql
CREATE DATABASE resolvenow_db;
```

Hibernate DDL mode is set to `update` across services, so tables (`users`, `complaints`, `complaint_history`, `assignments`, `notifications`) are created and updated automatically upon startup.

---

## 5. Startup Sequence & Commands (Windows PowerShell)

Services must be launched in order: Eureka first, followed by microservices, API Gateway, and frontend.

### Step 1: Start Eureka Discovery Server
```powershell
cd backend\eureka-server
.\mvnw.cmd spring-boot:run
```
*Wait until Eureka starts at `http://localhost:8761`.*

### Step 2: Start Backend Microservices (Separate Terminals)
```powershell
# Terminal 1 - Auth Service
cd backend\auth-service
.\mvnw.cmd spring-boot:run

# Terminal 2 - Complaint Service
cd backend\complaint-service
.\mvnw.cmd spring-boot:run

# Terminal 3 - Assignment Service
cd backend\assignment-service
.\mvnw.cmd spring-boot:run

# Terminal 4 - Notification Service
cd backend\notification-service
.\mvnw.cmd spring-boot:run
```

### Step 3: Start Spring Cloud API Gateway
```powershell
# Terminal 5 - API Gateway
cd backend\api-gateway
.\mvnw.cmd spring-boot:run
```
*Verify that Eureka dashboard (`http://localhost:8761`) shows `API-GATEWAY`, `AUTH-SERVICE`, `COMPLAINT-SERVICE`, `ASSIGNMENT-SERVICE`, and `NOTIFICATION-SERVICE` with status `UP`.*

### Step 4: Start Frontend
```powershell
# Terminal 6 - React Frontend
cd frontend
npm install
npm run dev
```
*Frontend opens at `http://localhost:5173`.*

---

## 6. API Endpoints Reference

All requests from clients route through the API Gateway at `http://localhost:8080`.

### Authentication Service (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user (`USER` role enforced). |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and return JWT. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile and roles. |

### Complaint Service (`/api/complaints`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/complaints` | Authenticated | List complaints (supports department filter). |
| `POST` | `/api/complaints` | Authenticated | Create a complaint with priority & automated SLA deadline. |
| `GET` | `/api/complaints/{id}` | Authenticated | Retrieve complaint details by ID. |
| `PATCH` | `/api/complaints/{id}/status` | Staff/Admin | Update complaint status (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`). |
| `POST` | `/api/complaints/{id}/escalate` | Staff/Admin | Escalate complaint priority and record audit note. |
| `GET` | `/api/complaints/{id}/history` | Authenticated | Retrieve audit history timeline for a complaint. |
| `GET` | `/api/complaints/stats` | Authenticated | Get aggregated complaint counts by status, priority, and overdue count. |

### Assignment Service (`/api/assignments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/assignments` | Authenticated | List all ticket assignments. |
| `POST` | `/api/assignments` | Staff/Admin | Assign a complaint to a technician or department. |
| `GET` | `/api/assignments/{id}` | Authenticated | Get assignment details by ID. |
| `PATCH` | `/api/assignments/{id}/status` | Staff/Admin | Update assignment status (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `REASSIGNED`). |
| `GET` | `/api/assignments/complaint/{complaintId}` | Authenticated | Get assignments associated with a specific complaint. |

### Notification Service (`/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | List current user's notifications. |
| `GET` | `/api/notifications/unread-count` | Authenticated | Get unread notification count for user. |
| `PATCH` | `/api/notifications/{id}/read` | Authenticated | Mark a single notification as read. |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications of current user as read. |
| `POST` | `/api/notifications` | Internal/Admin | Dispatch a notification to a user. |

---

## 7. Authentication & Security Flow

1. **Edge Gateway Filter (`JwtGatewayFilter`)**:
   - Intercepts incoming requests.
   - Bypasses public endpoints (`POST /api/auth/login`, `POST /api/auth/register`, `/eureka/**`).
   - Validates Bearer token format and JWT signature for all protected routes before routing downstream.
2. **Spring Security 6 Dispatch Integration**:
   - `requestMatchers("/error").permitAll()` is configured across Gateway and microservices to prevent error dispatches from triggering false 403 Forbidden responses.
   - `HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)` ensures clean 401 Unauthorized responses for missing or invalid tokens.
3. **Role-Based Access Control (RBAC)**:
   - Registration assigns the default `USER` role to prevent privilege escalation.
   - Status updates, ticket assignments, and escalations require `STAFF` or `ADMIN` roles.
   - Read operations for notifications and complaints enforce user-level data isolation.

---

## 8. Testing & Quality Assurance

### Run Backend Tests (44 Tests across all services)
```powershell
# API Gateway tests (5 tests)
cd backend\api-gateway; .\mvnw.cmd test; cd ..\..

# Auth Service tests (6 tests)
cd backend\auth-service; .\mvnw.cmd test; cd ..\..

# Complaint Service tests (18 tests)
cd backend\complaint-service; .\mvnw.cmd test; cd ..\..

# Assignment Service tests (9 tests)
cd backend\assignment-service; .\mvnw.cmd test; cd ..\..

# Notification Service tests (6 tests)
cd backend\notification-service; .\mvnw.cmd test; cd ..\..
```

### Run Frontend Lint & Build
```powershell
cd frontend
npm run lint    # Verifies with Oxlint (0 errors, 0 warnings)
npm run build   # Verifies production Vite bundle builds cleanly
```

---

## 9. Troubleshooting & Common Pitfalls

- **HTTP 403 on `/api/auth/login`**:
  - Check whether a stale Java process is holding port 8080 or 8081. Verify with `Get-NetTCPConnection -LocalPort 8080,8081` and restart services from the active workspace.
  - Verify that the API Gateway has `/error` permitted so unhandled exceptions do not get masked as 403 Forbidden.
- **Microservice Routing (404 / 503 from Gateway)**:
  - Check Eureka dashboard at `http://localhost:8761`. If a microservice is not listed, verify its `eureka.client.service-url.defaultZone` and allow up to 30 seconds for heartbeat registration.
- **Database Connection Issues**:
  - Verify PostgreSQL is running on port `5433` using `Get-Service` or `Test-NetConnection -Port 5433 -ComputerName localhost`.
