# AGENTS.md — LogiFlow Contributor & Project Agent Guide

## 1. Project Overview

**LogiFlow** (`D:\projects\logiflow`) is a multi-client logistics and dispatch platform with:
- **`server/`:** Java 21, Spring Boot 3.5.6, Spring Security (stateless JWT), Spring Data JPA (PostgreSQL in production/Compose, H2 `MODE=PostgreSQL` in unit/integration tests), STOMP/WebSocket (`WebSocketConfig`, `JwtHandshakeInterceptor`, `StompAuthChannelInterceptor`).
- **`client/`:** React 19, Vite 7, React Router 7, Axios, `@stomp/stompjs` + `sockjs-client`, Leaflet, Recharts, Playwright E2E.
- **`client_mobile/`:** Flutter (Driver and Customer mobile apps).

## 2. Engineering & Safety Boundaries

- **Auth & STOMP Security:** Keep Spring Security filters enabled in integration tests (do **not** use `@AutoConfigureMockMvc(addFilters = false)` for security-sensitive endpoints). Preserve STOMP `CONNECT`/`SUBSCRIBE`/`SEND` RBAC and trip/order ownership checks in `StompAuthChannelInterceptor`, `GpsTrackingController`, and `GpsLocationController`.
- **State & Transaction Consistency:** Route trip/order transitions through shared domain helpers (`TripStatus`, `TripServiceImpl.updateTripStatus`) and keep external HTTP I/O (`MapsServiceImpl`, `PayPalServiceImpl`, SMTP) outside `@Transactional` database locks.
- **Database Schema:** Production/Compose relies on JPA (`ddl-auto=update`); no Flyway/Liquibase migrations are currently configured.
- **Documentation & Scope:** Own project-level code, tests, focused commits, and project docs. Do **not** modify `D:\projects\engineering-operations\*` or change central backlog priorities.

## 3. Build, Lint, and Test Commands

Run backend Maven commands (`.\mvnw.cmd ...`) from `D:\projects\logiflow\server` and frontend `npm --prefix client ...` commands from `D:\projects\logiflow` (repository root):

```powershell
# Backend — Targeted inner-loop test (fast iteration)
.\mvnw.cmd -B test -Dtest=<TestClassName>

# Backend — Full test suite (pre-commit; runs on H2 MODE=PostgreSQL)
.\mvnw.cmd -B test

# Frontend — Lint & production build
npm --prefix client run lint
npm --prefix client run build

# Frontend — Full-stack Playwright E2E (requires running Spring Boot + PostgreSQL stack)
npm --prefix client run test:e2e
```

## 4. Verification & Reporting Notes

- **Lazy Route Timing:** In `client/src/App.jsx`, `MainLayout` is statically imported, while `DispatchLayout`, `AdminSideNav`, and lazy route page components use `React.lazy` inside `<Suspense>`. Playwright checks must wait for `networkidle` and `.route-loading` detachment before asserting DOM landmarks.
- **Flutter (`client_mobile/`):** `flutter` CLI is not installed on the local host; report mobile changes as statically inspected unless verified in CI.
- **H2 vs. PostgreSQL:** Backend tests run against H2 `MODE=PostgreSQL`; explicitly note this when reporting database constraint or locking verification.
