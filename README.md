# LogiFlow

LogiFlow is a full-stack logistics operations platform for managing freight from customer order to final delivery and payment.

Customers create orders, dispatchers plan and assign trips, drivers execute deliveries through a mobile app, and administrators oversee the entire operation.

## What it does

- Manages customer orders, trips, drivers, vehicles, routes, and payments
- Supports Admin, Dispatcher, Driver, and Customer workflows
- Tracks driver GPS locations and delivery progress
- Recommends driver and vehicle assignments
- Provides route planning, geocoding, directions, and rerouting
- Uses OCR to assist driver-license registration
- Supports operational chat, notifications, and audit logs
- Handles PayPal sandbox payment requests and invoice history
- Includes reporting and fleet oversight dashboards
- Serves both React web and Flutter mobile clients

## Main workflow

```text
Customer order
    → dispatch planning
    → driver and vehicle assignment
    → live trip tracking
    → delivery confirmation
    → payment and invoice
```

## Technology

- Java 21, Spring Boot, Spring Security, Spring Data JPA
- React 19, Vite, Material UI, Ant Design, Leaflet
- Flutter/Dart mobile application with foreground GPS tracking
- PostgreSQL 15 and PostGIS
- WebSocket/STOMP for real-time communication
- Cloudinary, Mistral AI, SMTP, maps, and PayPal integrations
- JUnit, ESLint, Docker, and GitHub Actions

## Run with Docker

Docker Desktop is the only requirement for the web stack.

PowerShell:

```powershell
Copy-Item .env.docker.example .env
docker compose up -d --build
```

Command Prompt:

```bat
copy .env.docker.example .env
docker compose up -d --build
```

Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:8080](http://localhost:8080).

Add optional Cloudinary, Mistral, email, and PayPal credentials to `.env`. Never commit the populated file.

## Run locally

Requirements: Java 21, Maven, Node.js, npm, and PostgreSQL 15+.

Backend:

```bash
cd server
mvn spring-boot:run
```

Web client, in another terminal:

```bash
cd client
npm install
npm run dev
```

Mobile client, optionally:

```bash
cd client_mobile
flutter pub get
flutter run
```

Backend environment variables are listed in `server/.env.example`.

## Tests

```bash
cd server && mvn test
cd client && npm run lint && npm run build
cd client_mobile && flutter analyze && flutter test
```

## Project structure

```text
server/             Spring Boot API and integrations
client/             React web application
client_mobile/      Flutter driver application
docs/               Architecture and project notes
compose.yaml        Containerized web stack
```

## Notes

This repository does not currently include a verified public deployment. Payment processing uses the PayPal sandbox, and external integrations require local credentials.
