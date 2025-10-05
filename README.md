# LogiFlow - Smart Logistics Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-17%2B-blue)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.0%2B-brightgreen)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB)](https://reactjs.org/)

LogiFlow is an intelligent logistics management system designed to automate and optimize driver and vehicle assignment for delivery operations. The system streamlines logistics operations, reduces manual work, and improves delivery efficiency through smart algorithms and real-time tracking.

## 🚀 Key Features

### 1. Smart Driver-Vehicle Assignment
- **License & Experience Matching**: Automatically assigns drivers to vehicles based on their license types (B2, C, D, E, FC) and experience
- **Health & Rest Monitoring**: Tracks driver working hours and enforces mandatory rest periods
- **Proximity-Based Dispatch**: Prioritizes drivers closest to the vehicle or pickup location

### 2. Intelligent Route Planning
- **Route Optimization**: Implements Vehicle Routing Problem (VRP) algorithms
- **Multi-Stop Support**: Efficiently handles multiple delivery points
- **Real-time Tracking**: Monitors vehicle and driver locations in real-time

### 3. Comprehensive Fleet Management
- **Vehicle Tracking**: Real-time monitoring of all fleet vehicles
- **Maintenance Scheduling**: Tracks vehicle maintenance and service history
- **Driver Rotation**: Implements fair shift rotation and workload balancing

### 4. Order Management
- **Order Assignment**: Links multiple orders to trips
- **Status Tracking**: Real-time order status updates
- **Customer Management**: Stores and manages customer information

## 🛠️ Tech Stack

### Backend (Spring Boot)
- **Java 21** - Core programming language
- **Spring Boot 3.5.6** - Backend framework
- **Spring Data JPA** - Database access and ORM
- **Spring Security** - Authentication and authorization
- **PostgreSQL** - Primary database (logiflow)
- **Spring Validation** - Request validation
- **Spring Web** - REST API development

### Frontend (React)
- **React 19.1.1** - Frontend library
- **Vite** - Build tool and development server
- **React DOM** - React rendering for the web
- **ESLint** - Code linting

## 🏗️ Database Schema

The system uses a relational database with the following key tables:

- **Users & Roles**: Authentication and authorization
- **Drivers**: Driver profiles, licenses, and status
- **Vehicles**: Fleet management and tracking
- **Routes**: Route planning and optimization
- **Trips**: Trip management and scheduling
- **Orders**: Order tracking and management
- **Work Logs**: Driver working hours and rest periods

## 🚀 Getting Started

### Prerequisites
- **Java 21** - For backend development
- **Node.js 18+** - For frontend development
- **PostgreSQL** - Database server (logiflow)
  - Tested with PostgreSQL 17
  - Should work with PostgreSQL 13+ (fully supported)
  - May work with PostgreSQL 11-12 (not officially tested)
  - Ensure your version is compatible with Spring Boot 3.5.6
- **Maven 3.6+** - Java dependency management and build tool

### Backend Setup
1. Clone the repository
2. Configure database in `application.properties`
3. Build and run with Maven:
   ```bash
   mvn spring-boot:run
   ```

### Frontend Setup
1. Navigate to the client directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📊 System Architecture

```
logiflow/
├── server/                      # Backend (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/logiflow/
│   │   │   │   ├── configs/     # Configuration classes
│   │   │   │   ├── controllers/  # REST controllers
│   │   │   │   ├── models/       # Entity models
│   │   │   │   ├── dtos/         # Data Transfer Objects
│   │   │   │   ├── repositories/ # Data access layer
│   │   │   │   ├── services/     # Business logic
│   │   │   │   └── LogiFlowApplication.java  # Main application class
│   │   │   └── resources/
│   │   │       ├── application.properties    # Application configuration
│   │   │       └── static/                  # Static resources
│   │   └── test/                            # Test files
│   └── pom.xml                              # Maven configuration
│
└── client/                      # Frontend (Vite + React)
    ├── public/                  # Static files
    ├── src/
    │   ├── assets/             # Static assets like images, fonts
    │   ├── components/         # Reusable UI components
    │   ├── App.jsx             # Root component
    │   ├── App.css             # Styles for App component
    │   ├── main.jsx            # Application entry point
    │   └── index.css           # Global styles
    ├── index.html              # Main HTML template
    ├── vite.config.js          # Vite configuration
    └── package.json            # Project dependencies and scripts
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines to get started.

## 📧 Contact

For any inquiries, please open an issue or contact the project maintainers.
