# CV and Interview Readiness

## Two-line CV description

LogiFlow is a Spring Boot, React, and Flutter logistics platform that coordinates role-based registration, dispatch, trip execution, live tracking, delivery, and payment workflows. It integrates PostgreSQL, JWT security, maps, OCR/AI, Cloudinary, PayPal, SMTP, WebSockets, reporting, and audit logging.

## CV bullet points

- Structured a multi-client logistics platform around Spring Boot controller-service-repository boundaries and role-specific API modules.
- Implemented JWT authentication and backend authorization for administrator, dispatcher, driver, and customer workflows.
- Modeled order-to-delivery operations including trip assignment, rerouting, status events, GPS tracking, and delivery confirmation.
- Integrated Cloudinary uploads, OCR/AI-assisted document intake, maps/routing, PayPal sandbox payments, email, and WebSocket notifications.
- Hardened configuration by removing committed credentials, requiring environment-based secrets, restricting public payment routes, and standardizing safe API errors.
- Established GitHub Actions validation for Java tests, React lint/build, and Flutter static analysis.

## LinkedIn description

LogiFlow is a team-built logistics operations platform with Spring Boot, React, Flutter, and PostgreSQL. It supports approval-based onboarding, role-aware dispatch and delivery workflows, GPS tracking, route planning, document intake, payments, notifications, reports, and audit history. The project demonstrates multi-client API design, workflow modeling, security boundaries, and practical third-party integrations.

## Interview questions and sample answers

### 1. Why use DTOs instead of returning JPA entities?

DTOs keep persistence choices out of the public contract, prevent accidental serialization of relationships or sensitive fields, and allow validation to reflect each use case. LogiFlow mostly follows this approach, though registration administration still contains entity-returning endpoints that should be migrated.

### 2. Where is authorization enforced?

Spring Security protects route groups by role, while authenticated user identity is available to controllers and services for ownership checks. A key next step is systematic tests proving that users cannot access another user's payment, chat, profile, notification, or tracking data by changing an ID.

### 3. How do you keep external integrations from dominating business logic?

Cloud uploads, email, maps, payments, and PDF generation are represented as services. Workflow services depend on those boundaries, which makes provider behavior replaceable and enables unit tests with mocks rather than real network calls.

### 4. How are API failures represented safely?

A `RestControllerAdvice` produces an envelope with timestamp, status, stable error code, safe message, path, and validation field errors. It maps malformed input, constraint violations, conflicts, forbidden actions, and unexpected errors without returning stack traces or database/provider messages.

### 5. What would you improve before production?

I would rotate all historically exposed credentials, replace schema auto-update with migrations, finish controller error migration, add ownership and transition tests, isolate seed/demo data, add observability and rate limiting, document OpenAPI contracts, and deploy through secret-managed infrastructure.

## Decisions to explain

- Controller-service-repository separation and where transaction boundaries belong
- JWT storage/expiration tradeoffs and route-level versus object-level authorization
- DTO mapping and validation boundaries
- Trip status transition invariants and concurrency handling
- GPS/WebSocket update flow and reconnect behavior
- Provider adapter failure and retry strategy
- PostgreSQL relational modeling and potential PostGIS usage

## Weak areas recruiters may question

- Very limited automated test coverage relative to the number of workflows
- JavaScript rather than TypeScript in the React client
- No verified Docker/local orchestration, migrations, Swagger UI, or live demo
- Remaining broad exception catches and entity-returning endpoints
- Credentials existed in Git history and require rotation
- Large UI components and mixed design-system dependencies
- Contribution boundaries cannot be inferred reliably from the recent commit history alone
