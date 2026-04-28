# LogiFlow

Full-stack logistics platform for freight operations with role-based workflows, dispatch planning, live tracking, and integrated document/payment pipelines.

## Tech Stack

**Backend:** Java 21, Spring Boot 3.5+, Spring Security, JPA/Hibernate, PostgreSQL 15 (PostGIS), JWT, Maven

**Frontend:** React 19, Vite

**Mobile:** Flutter 3.9+

**Integrations:** Cloudinary, Tesseract OCR, Mistral AI, PayPal Sandbox, SMTP

## Features

- **Role-Based Platform** - Separate capabilities for Admin, Dispatcher, Driver, and Customer users.
- **Dispatch and Trip Management** - Trip creation, assignment, rerouting, cancellation, and delivery confirmation workflows.
- **Order Lifecycle Operations** - Customer order creation and dispatch-side planning and updates.
- **Live Tracking and Maps** - GPS location updates, history tracking, geocoding, routing, and route optimization.
- **Registration Review Flow** - Driver/customer onboarding with admin approval and status control.
- **OCR Document Processing** - Driver license extraction to reduce manual registration input.
- **Payment Request Workflow** - PayPal sandbox integration with request, reminder, and status tracking.
- **Notification and Chat Modules** - In-app notifications and trip/order conversation endpoints.

## Architecture

**Three-Tier Design:** Controllers -> Services -> Repositories with clear separation of API, business logic, and persistence

**Role-Aware Access:** JWT authentication with Spring Security role checks across admin, dispatch, driver, and customer routes

**Operational Domain Modeling:** Strong relational schema for users, trips, orders, vehicles, registration requests, and audit trails

**Key Patterns:**
- DTO-based API contracts to avoid exposing internal entities.
- Centralized exception handling and consistent error responses.
- Adapter-style service integration for OCR, AI, payment, upload, and email providers.
- Role-specific endpoint grouping to keep modules isolated and maintainable.

## Permissions

| Feature | Admin | Dispatcher | Driver | Customer |
|---------|:-----:|:----------:|:------:|:--------:|
| Manage users and system settings | Y | | | |
| Create and assign trips | Y | Y | | |
| Execute trip operations | | Y | Y | |
| Create and track orders | | | | Y |
| View and manage notifications | Y | Y | Y | Y |

## Setup

### Backend
```bash
cd server
# configure src/main/resources/application.properties
mvn spring-boot:run
```
API: http://localhost:8080

### Frontend
```bash
cd client
npm install
npm run dev
```
App: http://localhost:5173

### Mobile (Optional)
```bash
cd client_mobile
flutter pub get
flutter run
```

## API Surface

- **Auth Module** - Registration, login, logout, JWT-based session flow.
- **Registration Module** - Driver/customer onboarding requests with admin review pipeline.
- **Dispatch Module** - Order planning, trip creation, assignment, reroute, and status transitions.
- **Driver Module** - Trip acceptance/execution, location updates, schedule and delivery actions.
- **Customer Module** - Order creation, tracking, profile, and history endpoints.
- **Admin Module** - User management, registration approvals, oversight, reports, and audit logs.

For complete route details, use the project's Swagger/OpenAPI docs when running the backend locally.

## Implementation Highlights

**Approval-Gated Onboarding**
- Registration requests are submitted first, then approved/rejected by admin review.
- User accounts are provisioned after approval with role-specific entity creation.
- Audit logging is captured for approval/rejection actions.

**OCR-Assisted Driver Intake**
- License fields can be extracted from image URLs during registration.
- Extraction falls back to manual entry when OCR confidence is insufficient.
- Date normalization is applied before returning extracted data to clients.

**Dispatch-Centric Trip Lifecycle**
- Trips support create, assign, status update, reroute, and cancel operations.
- Delivery confirmation endpoints support post-delivery verification.
- Driver and dispatcher modules consume the same trip lifecycle model.

**Integrated Operations Stack**
- Maps endpoints support geocoding, distance, directions, and route optimization.
- Payment endpoints support PayPal order creation and status handling.
- Notification and chat endpoints support cross-role operational communication.

## What This Demonstrates

- Full-stack logistics platform design with enterprise-style modular backend architecture.
- Role-based authorization applied across multiple operational domains.
- Real-world workflow modeling for registration, dispatch, delivery, and payment.
- Practical integration of OCR, AI, maps, notifications, and payment services.
- API design that supports both React web and Flutter mobile clients.
