# LogiFlow - Intelligent Heavy Logistics Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-21%2B-blue)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6%2B-brightgreen)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.1.1%2B-61DAFB)](https://reactjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.9.2%2B-02569B)](https://flutter.dev/)

LogiFlow is an intelligent logistics management system designed to automate and optimize heavy freight transportation operations. The system specializes in managing containers and heavy cargo (measured in tons) with smart driver assignment, real-time tracking, OCR-based verification, and comprehensive compliance monitoring. It serves B2B customers for industrial logistics, handling pickups from port terminals and warehouses with strict time management and delay handling workflows.

## 🚀 Key Features

### 1. Multi-Role User Management
- **Admin**: System oversight, driver onboarding with OCR verification, user management, trip monitoring, system configuration, audit logs, and reporting
- **Dispatcher**: Intelligent trip assignment, order management, real-time monitoring, route optimization, and communication
- **Driver (Mobile)**: Trip management, real-time navigation, delay reporting, compliance tracking, and delivery confirmation
- **Customer (Web/Mobile)**: B2B order placement, real-time tracking, company management, and delivery history
- **Manager**: Operational monitoring, performance analytics, and fleet optimization

### 2. Intelligent Driver-Vehicle Assignment
- **OCR-Based Verification**: Automated license and document extraction using Tesseract OCR
- **License & Experience Matching**: Automatic assignment based on driver licenses (B2, C, D, E, FC) and vehicle requirements
- **Capacity Matching**: Tonnage-based vehicle-driver pairing for heavy freight
- **Compliance Monitoring**: Real-time tracking of working hours and mandatory rest periods
- **Proximity-Based Dispatch**: Prioritizing drivers closest to pickup locations

### 3. Heavy Freight Order Management
- **Dual Pickup Sources**: Support for port terminals (container tracking, gate management) and warehouses (dock coordination)
- **Cargo Specification**: Detailed cargo information including tonnage, container numbers, and special handling requirements
- **B2B Customer Focus**: Company-based accounts with industrial delivery addresses
- **Contract-Based Pricing**: Hidden pricing during order creation, handled via B2B contracts

### 4. Advanced Route Planning & Tracking
- **GPS Integration**: Real-time vehicle and driver location monitoring
- **Route Visualization**: Interactive maps with Leaflet integration
- **Multi-Stop Support**: Efficient handling of complex delivery routes
- **ETA Calculations**: Accurate arrival time predictions with traffic considerations

### 5. Delay Management & Exception Handling
- **Driver Delay Reporting**: Seamless reporting with reason categorization (port congestion, warehouse delays, traffic, breakdowns)
- **Admin Review Process**: Delay justification review with SLA extension approval
- **Customer Notifications**: Real-time updates on delays with detailed explanations
- **Audit Trail**: Complete logging of delay events and resolutions

### 6. Comprehensive Fleet & Compliance Management
- **Vehicle Tracking**: Real-time monitoring of heavy trucks (Container Trucks, Tractor Units, Heavy Lorries)
- **Driver Work Logs**: Automated recording of working hours and rest compliance
- **Maintenance Scheduling**: Vehicle service history and preventive maintenance tracking
- **Performance Scoring**: Driver evaluation based on timeliness, compliance, and customer feedback

### 7. Communication & Notification System
- **Real-Time Chat**: Integrated messaging between dispatchers and drivers
- **Push Notifications**: Instant alerts for trip assignments, delays, and updates
- **WebSocket Integration**: Live updates using STOMP protocol
- **Multi-Channel Alerts**: Email, in-app, and mobile notifications

### 8. Delivery Confirmation & Proof of Delivery
- **Multi-Method Verification**: Signature capture, photo evidence, and OTP confirmation
- **Digital Documentation**: Automated generation of delivery receipts and POD reports
- **Customer Validation**: Secure confirmation processes at delivery locations

### 9. Analytics & Reporting
- **Operational Dashboards**: Real-time metrics on fleet utilization, delivery performance, and delays
- **Performance Analytics**: Driver and vehicle efficiency reports
- **Financial Integration**: PayPal payment processing for services
- **PDF Report Generation**: Automated report creation with iText integration

### 10. AI-Powered Enhancements
- **Mistral AI Integration**: Intelligent route suggestions and optimization recommendations
- **Smart Assignment Algorithms**: Machine learning-based driver-vehicle matching
- **Predictive Analytics**: Delay prediction and preventive action suggestions

## 🛠️ Tech Stack

### Backend (Spring Boot)
- **Java 21** - Core programming language
- **Spring Boot 3.5.6** - Backend framework
- **Spring Data JPA** - Database access and ORM
- **Spring Security** - Authentication and authorization with JWT
- **Spring Web** - REST API development
- **Spring Validation** - Request validation
- **Spring WebSocket** - Real-time communication
- **Spring Mail** - Email notification services
- **Spring AI 1.1.2** - AI integration with Mistral AI
- **Lombok** - Reduces boilerplate code with annotations
- **PostgreSQL** - Primary database (with PostGIS for spatial data)
- **JWT** - JSON Web Token for secure authentication
- **Tesseract OCR 5.9.0** - Optical character recognition for document processing
- **OpenCV 4.5.1** - Computer vision for image preprocessing
- **PayPal SDK** - Payment processing integration
- **iText 8.0.2** - PDF generation and manipulation
- **Thymeleaf** - Template engine for reports
- **Apache POI** - Excel file processing
- **OpenCSV** - CSV file processing
- **Cloudinary** - File upload and storage

### Frontend (React Web)
- **React 19.1.1** - Frontend library
- **Vite 7.1.7** - Build tool and development server
- **Material-UI 7.3.6** - Component library for modern UI
- **Ant Design 6.0.1** - Additional UI components
- **React Router DOM 7.9.5** - Client-side routing
- **Axios 1.13.2** - HTTP client for API calls
- **Leaflet 1.9.4** - Interactive maps
- **React Leaflet 5.0.0** - React components for Leaflet
- **STOMP.js 7.2.1** - WebSocket client for real-time communication
- **SockJS 1.6.1** - WebSocket fallback
- **Framer Motion 12.23.25** - Animation library
- **Recharts 3.5.1** - Data visualization
- **XLSX 0.18.5** - Excel file handling
- **React Icons 5.5.0** - Icon library

### Mobile App (Flutter)
- **Flutter 3.9.2+** - Cross-platform mobile framework
- **Dart SDK 3.9.2+** - Programming language
- **HTTP 1.2.1** - API client
- **WebSocket Channel 3.0.0** - WebSocket communication
- **STOMP Dart Client 3.0.1** - STOMP protocol for messaging
- **Shared Preferences 2.2.3** - Local data storage
- **Geolocator 10.1.0** - GPS location services
- **Geocoding 3.0.0** - Address resolution
- **Permission Handler 11.3.1** - Device permissions
- **Flutter Map 7.0.2** - Interactive maps
- **LatLong2 0.9.1** - Geographic coordinates
- **Flutter Local Notifications 17.2.2** - Push notifications
- **Signature 5.5.0** - Signature capture
- **Image Picker 1.0.7** - Camera and gallery access
- **PDF 3.10.7** - PDF generation
- **Path Provider 2.1.3** - File system access
- **Open File 3.3.2** - File opening
- **URL Launcher 6.3.0** - External URL handling

## 🏗️ Database Schema

The system uses PostgreSQL with the following key entities:

- **Users & Roles**: Authentication and role-based access (Admin, Dispatcher, Driver, Customer, Manager)
- **Customers**: B2B company accounts with delivery addresses
- **Drivers**: Driver profiles, licenses, work logs, and performance metrics
- **Vehicles**: Fleet management with tonnage capacity and maintenance records
- **Orders**: Heavy freight orders with pickup type (Port/Warehouse), cargo details, and tonnage
- **Trips**: Trip management with multi-order assignments and route planning
- **TripAssignments**: Links drivers to trips with primary/backup roles
- **Routes**: GPS-based route planning and optimization
- **Notifications**: Multi-channel notification system with read status
- **ChatMessages**: Real-time messaging between users
- **DeliveryConfirmations**: Proof of delivery with signatures, photos, and OTP
- **Payments**: PayPal integration for service payments
- **AuditLogs**: Comprehensive system activity logging
- **SystemSettings**: Configurable system parameters
- **RegistrationRequests**: Driver onboarding workflow with document verification

## 🚀 Getting Started

### Prerequisites
- **Java 21** - For backend development
- **Node.js 18+** - For web frontend development
- **Flutter SDK 3.9.2+** - For mobile app development
- **PostgreSQL 15+** - Database server (with PostGIS extension recommended)
- **Maven 3.6+** - Java dependency management
- **Android Studio** - For Android development and testing
- **VS Code** - Recommended IDE with Flutter extensions

### Backend Setup
1. Clone the repository
2. Configure database in `server/src/main/resources/application.properties`
3. Build and run with Maven:
   ```bash
   cd server
   mvn spring-boot:run
   ```

### Web Frontend Setup
1. Navigate to the client directory
2. Install dependencies:
   ```bash
   cd client
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Mobile App Setup
1. Navigate to the mobile client directory
2. Install Flutter dependencies:
   ```bash
   cd client_mobile
   flutter pub get
   ```
3. Run on connected device or emulator:
   ```bash
   flutter run
   ```

## 📊 System Architecture

```
logiflow/
├── server/                      # Backend (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/logiflow/server/
│   │   │   │   ├── configs/     # Security, CORS, WebSocket configs
│   │   │   │   ├── controllers/ # REST API endpoints by module
│   │   │   │   │   ├── admin/   # Admin management APIs
│   │   │   │   │   ├── auth/    # Authentication APIs
│   │   │   │   │   ├── chat/    # Messaging APIs
│   │   │   │   │   ├── customer/# Customer APIs
│   │   │   │   │   ├── dispatch/# Dispatcher APIs
│   │   │   │   │   ├── driver/  # Driver APIs
│   │   │   │   │   ├── maps/    # Route & GPS APIs
│   │   │   │   │   └── upload/  # File upload APIs
│   │   │   │   ├── dtos/        # Data Transfer Objects
│   │   │   │   ├── models/      # JPA Entity models
│   │   │   │   ├── repositories/# Data access layer
│   │   │   │   ├── services/    # Business logic layer
│   │   │   │   ├── utils/       # Utility classes
│   │   │   │   ├── websocket/   # WebSocket handlers
│   │   │   │   └── filters/     # Request filters
│   │   │   └── resources/
│   │   │       ├── application.properties  # App configuration
│   │   │       └── static/                 # Static resources
│   │   └── test/                           # Unit tests
│   ├── pom.xml                             # Maven configuration
│   └── uploads/                            # File upload directory
│
├── client/                      # Web Frontend (React)
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # Admin dashboard components
│   │   │   ├── auth/           # Authentication pages
│   │   │   ├── common/         # Shared components
│   │   │   ├── customer/       # Customer-facing pages
│   │   │   ├── dispatch/       # Dispatcher interface
│   │   │   ├── driver/         # Driver management
│   │   │   ├── home/           # Public landing pages
│   │   │   └── profile/        # User profile management
│   │   ├── services/           # API service layer
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # Application entry point
│   ├── vite.config.js          # Vite configuration
│   └── package.json            # Dependencies
│
└── client_mobile/              # Mobile App (Flutter)
    ├── lib/
    │   ├── models/            # Data models
    │   ├── screens/           # UI screens by user role
    │   ├── services/          # API and utility services
    │   ├── widgets/           # Reusable UI components
    │   └── main.dart          # App entry point
    ├── android/               # Android platform code
    ├── pubspec.yaml           # Flutter dependencies
    └── assets/                # Static assets
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines to get started.

## 📧 Contact

For any inquiries, please open an issue or contact the project maintainers.
