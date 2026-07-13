# LogiFlow

LogiFlow is a full-stack logistics operations platform for coordinating customer orders, dispatch planning, driver trips, tracking, documents, and payments.

## Overview

The application gives administrators, dispatchers, drivers, and customers role-specific workflows across a shared freight lifecycle. Its technically interesting areas are approval-gated onboarding, trip state management, live GPS updates, route planning, OCR-assisted document intake, payment requests, notifications, and support for both web and mobile clients.

## Key features

- JWT authentication and backend-enforced role authorization
- Driver and customer registration with administrator review
- Order planning, driver assignment, rerouting, cancellation, and delivery confirmation
- GPS location history, geocoding, directions, and route optimization
- OCR-assisted driver-license intake with manual fallback
- PayPal sandbox payment requests, reminders, and status tracking
- Notifications, operational chat, reporting, and audit logs

## Tech stack

- Backend: Java 21, Spring Boot 3.5, Spring Security, JPA/Hibernate, Maven
- Web: React 19, Vite, Axios, Material UI, Ant Design, Leaflet
- Mobile: Flutter/Dart with Android foreground GPS tracking
- Data: PostgreSQL 15/PostGIS
- Integrations: Cloudinary, Mistral AI, SMTP, PayPal Sandbox
- Testing/CI: JUnit 5, Spring MVC Test, ESLint, GitHub Actions

## Architecture

```text
React web client ---------+
                          +--> Spring Boot REST/WebSocket API --> PostgreSQL
Flutter mobile client ----+                 |
                                            +--> Maps / Cloudinary / OCR
                                            +--> PayPal / SMTP
```

HTTP controllers delegate business rules to services, which use repositories for persistence and provider adapters for external systems. DTOs define most public contracts, JWT claims establish identity and role, and Spring Security protects role-specific route groups. Errors use a structured response containing a timestamp, HTTP status, stable error code, safe message, request path, and optional field errors.

## Main roles

| Role | Primary capabilities |
|---|---|
| Admin | Review registrations, manage users/vehicles/settings, inspect operations, reports, payments, and audit logs |
| Dispatcher | Plan orders and trips, assign drivers/vehicles, reroute operations, and monitor progress |
| Driver | Accept and execute trips, publish location, chat, and confirm delivery |
| Customer | Create and track orders, manage profile, view history, and complete payment workflows |

## Important workflows

```text
Registration -> validation -> admin review -> role-specific account creation -> audit/email
Order -> dispatch planning -> driver/vehicle assignment -> trip events -> delivery confirmation
Delivery -> payment request -> PayPal sandbox -> status update -> invoice/history
```

## Project structure

```text
server/                 Spring Boot API, domain, services, persistence, integrations
client/src/             React pages, reusable components, and API services
client_mobile/lib/      Flutter screens, models, and platform services
docs/                   Architecture notes and repository assessment
.github/workflows/      Backend, frontend, and mobile CI validation
```

## Local setup

Prerequisites: Java 21, Maven 3.9+, Node.js 24+, npm, PostgreSQL 15+, and optionally Flutter 3.x.

### Docker Compose

Docker Desktop is the only prerequisite for the containerized web stack.

```bash
cp .env.docker.example .env
docker compose up -d --build
```

On Windows PowerShell, copy the environment file with:

```powershell
Copy-Item .env.docker.example .env
docker compose up -d --build
```

Open `http://localhost:5173`. The Vite development server runs in the frontend container, the API is exposed at `http://localhost:8080`, and PostgreSQL at `localhost:5432`. The first startup creates the schema and demo data, so it can take longer than subsequent starts.

Useful lifecycle commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose down
docker compose down -v  # also deletes the local database volume
```

Set integration credentials in `.env` when Cloudinary, Mistral AI, SMTP, or PayPal behavior is needed. The Flutter app runs natively and connects to the exposed backend port; it is not a long-running Compose service.

### Manual setup

1. Create a PostgreSQL database named `logiflow`.
2. Copy `server/.env.example` to a local secret file or export the listed variables in your shell. `JWT_SECRET` is required and must contain at least 32 characters. Provider credentials are needed only for their integrations.
3. Start the backend:

```bash
cd server
mvn spring-boot:run
```

4. Start the web client in another terminal:

```bash
cd client
npm ci
npm run dev
```

5. Optionally start the mobile client:

```bash
cd client_mobile
flutter pub get
flutter run
```

The API runs at `http://localhost:8080`; the web client defaults to `http://localhost:5173`. This repository does not currently include a verified public demo or OpenAPI UI, so none is claimed.

## Environment variables

See [`server/.env.example`](server/.env.example). Never commit populated secrets. Credentials previously present in repository history must be rotated before any deployment.

## Testing

```bash
cd server && mvn test
cd client && npm ci && npm run lint && npm run build
cd client_mobile && flutter pub get && flutter analyze && flutter test
```

GitHub Actions runs backend tests, frontend lint/build, and Flutter analysis. The web production build and strict lint command pass locally with no lint findings. Current automated coverage is limited; authorization, trip transitions, payment ownership, exception handling, and critical UI workflows remain the highest-priority additions.

## Technical highlights

- Role-based access control with Spring Security and JWT authentication
- Consistent API responses through DTOs and centralized error handling
- Environment-based configuration for credentials and deployment settings
- Service-based integrations for payments, email, storage, maps, and AI features
- Shared backend APIs for the React web application and Flutter mobile application

## Roadmap

- Expand authorization and integration test coverage
- Complete DTO adoption across remaining endpoints
- Improve shared frontend authentication and error handling
- Add workflow screenshots and a hosted demo
