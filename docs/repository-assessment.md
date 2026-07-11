# Repository Assessment

Assessment date: 2026-07-11

## Current architecture

LogiFlow is a three-client logistics platform: a Spring Boot REST/WebSocket backend, a React web application, and a Flutter mobile application. The backend uses controller-service-repository layering, JPA/PostgreSQL, JWT security, and adapters for Cloudinary, Mistral AI, SMTP, PayPal, maps, and PDF generation. Role-specific modules cover admin, dispatcher, driver, and customer workflows.

## Prioritized findings

### Critical

- Production-capable credentials were committed in `application.properties`. They were replaced with environment variables, but every exposed credential must be rotated and Git history should be treated as compromised.
- Payment and order patterns were broadly public. Payment mutations now require authentication; callback endpoints remain public.
- Some controllers concatenate exception messages into responses, which can reveal provider or persistence details. New code should use the centralized error contract; remaining controllers need incremental migration.

### High priority

- Validation coverage is inconsistent across request DTOs and query/path parameters.
- Several controllers catch broad exceptions, choose status codes locally, and return unrelated response shapes.
- Admin registration endpoints expose `RegistrationRequest` entities directly.
- Ownership enforcement needs endpoint-by-endpoint tests, particularly payment, chat, notifications, profile-by-id, and tracking.
- Automated coverage is minimal and requires database/provider-independent service, security, and controller tests.

### Medium priority

- Backend package names are plural and repository packages mix domain folders with underscore naming.
- Service interfaces and implementations share packages, while several DTO containers hold many nested records/classes.
- React pages are stored under `components`; auth persistence and user updates remain repeated across a few pages.
- The web client uses JavaScript rather than typed API contracts and has no test runner.
- Some large React pages and map components still combine data fetching, state, rendering, and mapping logic; dead code and lint findings were removed without redesigning them.
- Sample uploaded profile images remain committed outside the source tree and should be reviewed for provenance. Development notification/email test endpoints were removed from production source paths.

### Optional improvements

- Introduce OpenAPI endpoint descriptions and security schemes.
- Migrate frontend modules incrementally to TypeScript.
- Add Testcontainers-backed repository tests and browser-level workflow tests.
- Add Docker Compose, screenshots, and a deployed demo after secrets and sample data are isolated.

## Refactoring order

1. Rotate credentials; externalize configuration; lock down public routes.
2. Standardize errors and input validation; migrate controllers away from broad catches.
3. Add authorization and ownership tests around sensitive workflows.
4. Replace entity responses with request/response DTOs and explicit mappers.
5. Consolidate frontend auth/API/error behavior and split the largest pages.
6. Normalize packages only after behavior is protected by tests.
7. Add API documentation, deployment assets, screenshots, and stronger portfolio evidence.

Large-scale package moves were deliberately deferred: without adequate tests they create noisy diffs and unnecessary regression risk.
