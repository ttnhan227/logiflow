<p align="center">
  <img src="docs/assets/banner.svg" alt="LogiFlow Banner" width="100%">
</p>

<p align="center">
  <strong>An academic freight-management application with multi-role workflows, WebSocket driver-location updates, React/Leaflet maps, and a Flutter driver client.</strong>
</p>

<p align="center">
  <a href="https://logiflow-client.onrender.com"><img src="https://img.shields.io/badge/Live-Demo-brightgreen?style=flat-square" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/Java-17%20%2F%2021-ED8B00.svg" alt="Java">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.2+-6DB33F.svg" alt="Spring Boot 3">
  <img src="https://img.shields.io/badge/React-19-61dafb.svg" alt="React 19">
  <img src="https://img.shields.io/badge/Flutter-Mobile-02569B.svg" alt="Flutter">
  <img src="https://img.shields.io/badge/PostgreSQL-PostGIS-336791.svg" alt="PostgreSQL PostGIS">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ed.svg" alt="Docker Compose">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</p>

---

> **Project scope:** LogiFlow is a portfolio and academic project, not a live freight carrier. PayPal runs in sandbox mode, license OCR extracts fields for human review, and sample coverage, contacts, and operational data are demonstrations rather than commercial commitments.

## Platform Visual Preview

| Landing Page & Operations Dashboard | Driver Locations & Route Map |
|:---:|:---:|
| ![LogiFlow landing page](docs/screenshots/logiflow-home-hero.png) | ![Driver location map](docs/screenshots/logiflow-map.png) |
| **Operations Management Dashboard** | **Public Shipment Tracking & Telemetry** |
| ![Dispatcher Operations Console](docs/screenshots/logiflow-dashboard.png) | ![Public Milestone Tracking](docs/screenshots/logiflow-track.png) |
| **Performance & Delay Reports** | **Sample Logistics News Feed** |
| ![Performance and delay reports](docs/screenshots/logiflow-reports.png) | ![Sample logistics news](docs/screenshots/logiflow-news.png) |

---

## DevOps & Infrastructure

LogiFlow is orchestrated via Docker Compose for local microservices and deployed through GitHub Actions CI pipelines.

### End-to-End Architecture

```text
React 19 Web App (Admin / Dispatcher)        Flutter Mobile App (Driver GPS)
                 │                                           │
                 │ HTTPS / REST & WSS / STOMP                │ HTTPS / WSS
                 ▼                                           ▼
+─────────────────────────────────────────────────────────────────────────────+
|                            SPRING BOOT 3 BACKEND                            |
|                                                                             |
|  ├─ Security & Auth       ──► JWT Bearer Auth & Multi-Role RBAC             |
|  ├─ Dispatch Engine       ──► Trip State Machine & Driver Assignment        |
|  ├─ Real-Time Telemetry   ──► STOMP WebSockets & Live GPS Streaming         |
|  ├─ Proof of Delivery     ──► Digital Signature Capture & Photo Upload      |
|  └─ Billing Demo          ──► PayPal Sandbox & PDF Invoices                 |
+─────────────────────────────────────────────────────────────────────────────+
                 │                                           │
                 ▼                                           ▼
PostgreSQL 15                                   External APIs (PayPal, Cloudinary)
```

### Services

| Service | Technology | Role |
|---|---|---|
| Backend API | Spring Boot 3 + Java 17/21 | RESTful endpoints, WebSocket broker, security, business logic |
| Web Client | React 19 + Ant Design | Dispatcher command console, tracking portal, analytics |
| Mobile Client | Flutter (Dart) | Driver turn-by-turn tracking, signature capture, status updates |
| Database | PostgreSQL 15 | Relational storage for users, orders, trips, and telemetry |
| Telemetry Broker | Spring STOMP / WebSockets | Trip-scoped driver-location updates |
| Containerization | Docker + Docker Compose | Multi-service orchestration (`compose.yaml`) |

### Implementation Notes

- **Map-based Routing** — Geocoding and routing data are displayed in Leaflet/OpenStreetMap views.
- **STOMP Location Updates** — Drivers publish location updates over WebSockets and web clients subscribe by trip.
- **Role-Based Workflows** — Spring Security restricts endpoints by role while service code handles trip-state transitions.
- **Invoices and Sandbox Payments** — Thymeleaf/iText generates PDFs and the PayPal sandbox demonstrates checkout and capture flows.

---

## Features

- **Driver Location Updates**: Trip-scoped coordinates are sent over WebSockets and displayed on Leaflet maps.
- **Multi-Role Coordination**: Tailored portals for Admins (fleet config), Dispatchers (trip routing), Drivers (POD execution), and Customers (public tracking).
- **Proof of Delivery (POD)**: On-glass digital signature capture and delivery photo uploads.
- **Rule-Based Driver Recommendations**: Scores drivers using availability, license category, current location, and vehicle capacity.
- **License Data Extraction**: Uses Mistral OCR to prefill fields from a driver-license image for human review.
- **Invoices and Sandbox Checkout**: Generates PDF invoices and integrates PayPal sandbox checkout.
- **Delivery-Target & Delay Analytics**: Demonstration dashboards for transit times, on-time rates, and delay alerts.

---

## Tech Stack

- **Backend**: Spring Boot 3, Java 17/21, Spring Security, Spring Data JPA, Hibernate Spatial
- **Web Frontend**: React 19, Vite, Ant Design, Leaflet, SockJS, StompJS
- **Mobile Application**: Flutter, Dart, Google Maps / OpenStreetMap SDK
- **Database**: PostgreSQL 15, PostGIS extension
- **Infrastructure**: Docker, Docker Compose, GitHub Actions CI

---

## Getting Started

### 1. Clone repository & configure environment

```bash
git clone https://github.com/ttnhan227/logiflow.git
cd logiflow
cp .env.example .env
```

### 2. Start with Docker Compose

```bash
docker compose up -d --build
```

| Endpoint | URL |
|---|---|
| Dispatcher & Customer Web App | http://localhost:5173 |
| Spring Boot Backend API | http://localhost:8080/api |
| Swagger API Documentation | http://localhost:8080/swagger-ui.html |

---

## Environment Variables Reference

| Variable | Description | Default / Example |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Active Spring profile (`dev` or `prod`) | `dev` |
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL with PostGIS | `jdbc:postgresql://postgres:5432/logiflow` |
| `SPRING_DATASOURCE_USERNAME` | Database user | `logiflow` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `logiflow_secret` |
| `JWT_SECRET` | Secret key for HS256 JWT access tokens | `min-32-chars-secret-key-for-jwt` |
| `PAYPAL_CLIENT_ID` | PayPal Sandbox Client ID | `sandbox_client_id` |
| `PAYPAL_CLIENT_SECRET` | PayPal Sandbox Secret Key | `sandbox_secret_key` |
| `CLOUDINARY_URL` | Cloudinary storage connection string for POD images | `cloudinary://...` |

---

## Testing & Quality Assurance

```bash
# Run backend JUnit & Mockito test suites
cd server
./mvnw test

# Run frontend unit tests
cd ../client
npm test
npm run build
```

---

## License

MIT
