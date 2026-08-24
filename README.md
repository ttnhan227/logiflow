# LogiFlow — Enterprise Logistics & Freight Operations Platform

LogiFlow is a production-oriented, full-stack logistics and freight management platform designed to orchestrate end-to-end cargo transportation workflows—from order placement and dispatch route optimization to real-time driver tracking, proof-of-delivery (POD) confirmation, automated billing, and PayPal checkout.

---

## System Architecture

```text
+-----------------------------------------------------------------------------------+
|                                  CLIENT APPLICATIONS                              |
|                                                                                   |
|   +------------------------------------+    +---------------------------------+   |
|   |         React 19 Web App           |    |       Flutter Mobile App        |   |
|   |   (Admin, Dispatcher, Customer)    |    |      (Driver Execution, GPS)    |   |
|   +-----------------+------------------+    +----------------+----------------+   |
+---------------------|----------------------------------------|--------------------+
                      | HTTPS / REST & WSS / STOMP             | HTTPS / WSS
                      v                                        v
+-----------------------------------------------------------------------------------+
|                              SPRING BOOT 3 BACKEND                                |
|                                                                                   |
|   +--------------------+  +----------------------+  +-------------------------+   |
|   | Security & Auth    |  | Dispatch Engine      |  | Real-Time Service       |   |
|   | - JWT Bearer Auth  |  | - Trip State Machine |  | - STOMP WebSocket       |   |
|   | - Role-Based Guard |  | - Driver Matching    |  | - GPS Telemetry Stream  |   |
|   | - License OCR AI   |  | - CSV/Excel Importer |  | - Driver/Customer Chat  |   |
|   +--------------------+  +----------------------+  +-------------------------+   |
|                                                                                   |
|   +--------------------+  +----------------------+  +-------------------------+   |
|   | Billing & Payments |  | Proof of Delivery    |  | Auditing & Reports      |   |
|   | - PayPal Checkout  |  | - Digital Signature  |  | - Administrative Logs   |   |
|   | - Invoice PDF Gen  |  | - Photo Upload       |  | - Performance Analytics |   |
|   +--------------------+  +----------------------+  +-------------------------+   |
+-----------------------------------------------------------------------------------+
                      |                                        |
                      v                                        v
+---------------------------------------------+   +---------------------------------+
|               PERSISTENCE LAYER             |   |        EXTERNAL SERVICES        |
|  - PostgreSQL 15 (Relational Data Model)    |   |  - PayPal Sandbox (Payments)    |
|  - PostGIS (Spatial Geometries & Routing)   |   |  - Mistral AI (License OCR)     |
|  - Hibernate / Spring Data JPA              |   |  - Cloudinary (Document Storage)|
+---------------------------------------------+   +---------------------------------+
```

---

## Core Operations Workflows

### 1. Customer Order Lifecycle
1. Customer registers or logs in, providing cargo parameters (weight in tons, volume, pickup/delivery addresses, cargo type).
2. Order is created in `PENDING` state with distance and fee calculated.
3. Customer receives live shipment status updates and can message the operations team via order chat.

### 2. Dispatch Planning & Driver Assignment
1. Dispatcher accesses the centralized Dispatch Console with real-time filtering by status, date, and priority.
2. Orders can be imported in bulk via CSV or Excel (`.xlsx`) using validated spreadsheet templates.
3. Trips are generated (`DRAFT` state) and matched to available drivers and vehicles based on cargo weight, vehicle capacity, and driver proximity.
4. Assigned trips advance to `ASSIGNED` state and notify drivers immediately via WebSocket STOMP push notifications.

### 3. Driver Trip Execution & Telemetry
1. Driver logs in through the mobile app, reviews assigned cargo details and routing waypoints, and updates trip status to `IN_TRANSIT`.
2. Mobile client periodically streams GPS latitude/longitude coordinates to `/app/driver/location`.
3. Dispatchers and customers track the live vehicle location on interactive Leaflet maps.

### 4. Proof of Delivery (POD) & Fulfillment
1. Upon arrival, driver collects recipient digital signature and optional photographic evidence.
2. Trip state transitions to `COMPLETED` and order status updates to `DELIVERED`.
3. Immutable audit logs record the completion timestamp and actor.

### 5. Payment Requests & Invoicing
1. Administrator reviews delivered orders in the Payment Management console and generates grouped payment requests.
2. Customer receives payment notification with direct PayPal checkout integration.
3. System confirms PayPal transaction completion, updates payment status to `PAID`, and renders downloadable PDF invoices via Thymeleaf + iText.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Java 21, Spring Boot 3.5.6, Spring Security 6 (Stateless JWT), Spring Data JPA, Spring WebSocket (STOMP), Hibernate |
| **Database** | PostgreSQL 15, PostGIS extension, Liquibase / JPA schema generation |
| **Frontend** | React 19, Vite, Material-UI, Ant Design, Leaflet Maps, React Router 7 |
| **Mobile** | Flutter 3 / Dart, Geolocator background/foreground telemetry, Stomp Dart Client |
| **Document & AI** | iText PDF Engine, Thymeleaf templates, Mistral AI OCR, Cloudinary SDK |
| **Infrastructure** | Docker Compose, Maven 3.9, Node.js 20+, GitHub Actions CI |

---

## Quickstart Guide

### Option A: Run with Docker Compose (Recommended)

Docker Desktop is the only requirement to run the full database, backend API, web frontend, and mobile web client.

```bash
# 1. Clone repository
git clone https://github.com/ttnhan227/logiflow.git
cd logiflow

# 2. Copy Docker environment variables
# On Windows PowerShell:
Copy-Item .env.docker.example .env
# On Linux / macOS / Bash:
cp .env.docker.example .env

# 3. Build and launch all 4 containers
docker compose up -d --build
```

#### Service Endpoints

| Service | Technology | URL / Port |
| :--- | :--- | :--- |
| 🌐 **Web Dashboard** | React 19 + Vite | [http://localhost:5173](http://localhost:5173) |
| 📱 **Mobile Web Client** | Flutter 3.24 + Nginx | [http://localhost:8085](http://localhost:8085) |
| ⚙️ **Backend REST & WS** | Spring Boot 3.5 | [http://localhost:8080](http://localhost:8080) |
| 🗄️ **PostgreSQL Database** | PostgreSQL 15 + PostGIS | `localhost:5432` (`logiflow`, `postgres`) |

---

### Demo Seeded Accounts

The database automatically seeds realistic operational demo accounts on initial launch (all passwords are **`123`**):

| Role | Username | Email | Password | Access Port |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin@logiflow.com` | `123` | `:5173` |
| **Dispatcher** | `john.dispatcher` | `john.d@logiflow.com` | `123` | `:5173` |
| **Driver** | `sarah.driver` | `sarah.d@logiflow.com` | `123` | `:5173` & `:8085` |
| **Driver** | `mike.driver` | `mike.d@logiflow.com` | `123` | `:5173` & `:8085` |
| **Customer** | `nguyen.mai` | `nguyen.mai@gmail.com` | `123` | `:5173` & `:8085` |

---

### Option B: Local Developer Setup

#### Prerequisites
- Java 21 JDK (e.g., Eclipse Temurin 21)
- Node.js 20+ and npm 10+
- PostgreSQL 15+ running locally with PostGIS extension
- Flutter SDK 3.24+ (for mobile development)

#### Backend Setup
```bash
cd server
mvn spring-boot:run
```

#### Web Frontend Setup
```bash
cd client
npm install
npm run dev
```

#### Mobile Client Setup (Native or Chrome Web)
```bash
cd client_mobile
flutter pub get
flutter run -d chrome    # Run as web app
flutter run              # Run on connected device/emulator
```

---

## Environment Variables

Key environment variables configured in `.env` or `server/src/main/resources/application.properties`:

| Variable | Description | Default / Example |
|---|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/logiflow_db` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `postgres` |
| `JWT_SECRET` | 256-bit secret key for JWT signing | *(Base64 encoded string)* |
| `JWT_EXPIRATION_MS` | JWT expiration duration in ms | `86400000` (24 hours) |
| `PAYPAL_CLIENT_ID` | PayPal REST API client ID | *(Sandbox credential)* |
| `PAYPAL_CLIENT_SECRET` | PayPal REST API client secret | *(Sandbox credential)* |
| `PAYPAL_MODE` | PayPal operating mode | `sandbox` or `live` |
| `MISTRAL_API_KEY` | Mistral AI API key for license OCR | *(Optional for OCR extraction)* |
| `CLOUDINARY_URL` | Cloudinary storage URL | *(Optional for remote uploads)* |

---

## Testing & Quality Assurance

```bash
# Backend unit and integration tests (via Docker Maven or local mvn)
docker run --rm -v "${PWD}/server:/workspace" -w /workspace maven:3.9-eclipse-temurin-21-alpine mvn test

# Frontend linting and production build
cd client
npm run lint
npm run build

# Mobile client analysis and tests (optional)
cd client_mobile
flutter analyze
flutter test
```

---

## Engineering Decisions & Architecture Highlights

1. **Centralized Error Contract**: Replaced ad-hoc controller error responses and empty 400s with a unified `@RestControllerAdvice` (`GlobalExceptionHandler`) emitting standardized `ApiErrorResponse` envelopes (`status`, `error`, `message`, `path`, `fieldErrors`).
2. **Unified Enterprise Design System**: Standardized CSS across all modules into `enterprise-theme.css`, eliminating divergent color palettes, purple gradients, and leftover template artifacts.
3. **Decoupled Asynchronous Telemetry**: Separated high-frequency driver GPS coordinate updates over STOMP WebSocket channels from transactional trip status transitions in PostgreSQL.
4. **Resilient Document Processing**: Supported both local filesystem storage and Cloudinary cloud storage with MIME type inspection and size validation.

---

## Recruiter & Interview Portfolio Pack

### Resume / CV Highlights
- **Engineered an enterprise logistics platform** orchestrating freight operations across 4 role hierarchies (Admin, Dispatcher, Driver, Customer), managing orders, real-time dispatch, fleet telemetry, and payments.
- **Architected a high-throughput dispatch engine** in Spring Boot 3 & PostgreSQL handling dynamic trip routing, driver-vehicle capacity matching, and bulk spreadsheet ingestion (CSV/XLSX).
- **Built real-time telemetry pipelines** leveraging WebSocket STOMP protocols for sub-second driver GPS tracking and bidirectional operational dispatch chat.
- **Designed automated billing & payment infrastructure** integrating PayPal sandbox checkout workflows and server-side PDF invoice rendering via Thymeleaf and iText.
- **Standardized API reliability and client UX**, replacing unstructured error handling with a centralized exception advice architecture and building a coherent enterprise design system in React 19.

### LinkedIn Summary
> **LogiFlow — Enterprise Logistics & Freight Management System**
> Architected a full-stack logistics solution built with Java 21, Spring Boot 3.5, PostgreSQL/PostGIS, React 19, and Flutter. The platform streamlines B2B freight operations through automated dispatch recommendation, live GPS telemetry over WebSockets, digital Proof-of-Delivery, PayPal payment workflows, and AI-assisted driver credential verification.

### Technical Interview Q&A

<details>
<summary><strong>1. How does LogiFlow guarantee data consistency during trip dispatch and driver assignment?</strong></summary>

**Answer:** LogiFlow manages trip lifecycle transitions via transactional service boundaries (`@Transactional` in `TripServiceImpl`). When a trip transitions (e.g. from `DRAFT` to `ASSIGNED`), the system validates entity state machines, ensures driver and vehicle availability constraints are met, updates foreign key relations atomically, logs the event to `AuditLogService`, and broadcasts the change over WebSocket STOMP channels. If any constraint fails, the transaction rolls back cleanly without leaving orphaned records.
</details>

<details>
<summary><strong>2. How is real-time GPS tracking implemented without overwhelming the transactional database?</strong></summary>

**Answer:** GPS location telemetry uses lightweight WebSocket STOMP messaging (`/app/driver/location` topic). High-frequency location updates are streamed directly to subscribed dispatcher and customer clients for live map rendering. State-critical milestones (trip start, checkpoint arrival, completion) are persisted into `TripProgressEvent` records, separating volatile ephemeral telemetry from immutable audit history.
</details>

<details>
<summary><strong>3. How does the exception handling architecture provide reliable API contracts?</strong></summary>

**Answer:** The API uses Spring's `@RestControllerAdvice` (`GlobalExceptionHandler`) to intercept both checked business exceptions (`BusinessRuleException`, `ResourceNotFoundException`) and framework validation failures (`MethodArgumentNotValidException`). It normalizes all failure responses into a predictable `ApiErrorResponse` schema containing timestamp, HTTP status code, machine-readable error codes, human-readable explanations, and field-level validation maps.
</details>

<details>
<summary><strong>4. How are bulk order imports processed safely from Excel and CSV spreadsheets?</strong></summary>

**Answer:** In `OrderServiceImpl.importOrders`, the uploaded multipart file is validated for MIME type, non-emptiness, and size limits. The stream is parsed row-by-row using Apache POI (for XLSX) or Apache Commons CSV (for CSV). Each row undergoes field-level data type conversion, coordinate parsing, and validation against domain constraints. Failed rows are captured with detailed line-number error descriptors while valid records are batch-persisted.
</details>

<details>
<summary><strong>5. How does LogiFlow maintain visual and UI consistency across complex enterprise dashboards?</strong></summary>

**Answer:** The frontend is built on a consolidated design system (`enterprise-theme.css`) defining HSL/Hex color tokens, consistent spacing scales, typography standards, responsive table layouts, and form control states. By eliminating inline ad-hoc rules and isolated component style overrides, the entire application maintains a coherent, professional enterprise aesthetic across all roles.
</details>

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
