# LogiFlow — Backend-Driven Logistics Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-21%2B-blue)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5%2B-brightgreen)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://reactjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.9%2B-02569B)](https://flutter.dev/)

LogiFlow is a full-stack logistics management system designed to simulate real-world heavy freight operations. The platform manages container workflows, driver allocation, compliance monitoring, and real-time tracking across web and mobile clients.

Developed as a team project, where I led the backend architecture and infrastructure design.

## 👤 My Role & Backend Ownership

In this project, I was responsible for designing and implementing the entire backend foundation, including:

- **Architecture Lead**: Designed the layered structure and established backend standards for the team.
- **Security & Auth**: Designed JWT-based stateless authentication and Spring Security configuration with role-based authorization.
- **Database Schema**: Designed the database schema and managed complex entity relationships (OneToMany, ManyToOne).
- **Infrastructure**: Implemented centralized exception handling and structured the service layer to ensure business logic remains isolated from API contracts.

Other team members implemented features and developed the frontend and mobile applications based on this backend infrastructure.

## 🧱 System Architecture

The backend follows a layered architecture inspired by production practices:
`Controller → Service → Repository → Database`

### Key Design Decisions
- **Separation of Concerns**: Business logic is strictly isolated in the service layer, while controllers manage HTTP request/response cycles.
- **DTO Pattern**: Used to prevent exposing internal domain models and maintain clean, stable API contracts.
- **Stateless Auth**: Leveraged JWT to allow horizontal scalability without server-side sessions.
- **RBAC**: Role-based access control via Spring Security filters to ensure secure operation across different user types.

## 🧠 Engineering Decisions

### Secure Stateless Authentication
Implemented JWT-based authentication with Spring Security instead of session-based auth to support scalability and clean client–server separation. Role-based access control protects endpoints for Admin, Dispatcher, Driver, and Customer roles.

### Database & Relationship Design
Structured relational mappings (OneToMany, ManyToOne) with proper constraints and cascade rules. Handled serialization and lazy-loading concerns to avoid common JPA pitfalls.

### External Service Integration
Integrated Cloudinary, Tesseract OCR, Mistral AI, PayPal Sandbox, and SMTP services with externalized configuration to maintain security and modularity.

## 🔐 Security Implementation
- **JWT-based authentication** for stateless session management.
- **BCrypt password hashing** for secure credential storage.
- **Role-based endpoint protection** via Spring Security.
- **Secure configuration** for external services (Cloudinary, PayPal, Email, AI APIs) via externalized properties.

## 🌐 Core Capabilities
- **Role-aware driver assignment workflow**
- **Container and cargo management**
- **Real-time tracking integration**
- **OCR-based document digitization** (Tesseract)
- **AI-powered logistics insights** (Mistral AI)
- **Secure payment processing** (PayPal Sandbox)
- **Automated email notifications** (SMTP)
- **Swagger API documentation**

## 🛠 Tech Stack

**Backend:**
- Java 21
- Spring Boot 3.5+
- Spring Security
- PostgreSQL 15 (PostGIS support)
- Maven

**Web Frontend:**
- React 19 + Vite

**Mobile:**
- Flutter 3.9+

**External Integrations:**
- Cloudinary (File Storage)
- Tesseract OCR (Document Processing)
- Mistral AI (AI Features)
- PayPal Sandbox (Payments)

## 🏗 Project Structure
```
logiflow/
├── server/          # Spring Boot backend
├── client/          # React web application
└── client_mobile/   # Flutter mobile application
```

## 🚀 Future Improvements
- **Dockerization**: Containerization of all services for simplified, consistent deployment.
- **CI/CD Pipeline**: Automated testing and deployment workflows.
- **Monitoring & Logging**: Implementing centralized logging and performance monitoring.
- **Cloud Migration**: Deployment to cloud platforms (AWS/Azure) for production scalability.

## ⚙️ Running Locally (Simplified)

1. **Configure PostgreSQL**: Ensure database is running and accessible.
2. **Update Properties**: Configure `application.properties` with database credentials and API keys for external services.
3. **Run Backend**: Start the Spring Boot application from the `server` directory.
4. **Start Web Frontend**: Navigate to `client`, run `npm install` and `npm run dev`.
5. **Run Mobile Client (Optional)**: Open `client_mobile` in Android Studio/VS Code and run on an emulator/device.

Detailed configuration steps are available in the project folders.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
