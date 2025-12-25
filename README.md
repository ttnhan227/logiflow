# LogiFlow - Intelligent Heavy Logistics Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-21%2B-blue)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6%2B-brightgreen)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.1.1%2B-61DAFB)](https://reactjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.9.2%2B-02569B)](https://flutter.dev/)

LogiFlow is an intelligent logistics management system designed to automate and optimize heavy freight transportation operations. The system specializes in managing containers and heavy cargo with smart driver assignment, real-time tracking, and comprehensive compliance monitoring.

## 🚀 Quick Start

This project consists of three main components that must be set up in order:

### Prerequisites
- **Java 21+** - For backend development
- **Node.js 18+** - For web frontend development
- **Flutter SDK 3.9.2+** - For mobile app development
- **PostgreSQL 15+** - Database server (with PostGIS extension recommended)
- **IntelliJ IDEA** - For Spring Boot backend
- **Android Studio** - For Flutter mobile development

## 🛠️ Installation & Setup

### 1. Backend (Spring Boot) - IntelliJ IDEA

**Requirements:**
- Java 21+
- PostgreSQL 15+ with PostGIS
- Maven 3.6+

**Setup Steps:**
1. Open the `server` directory in IntelliJ IDEA
2. Configure database connection in `server/src/main/resources/application.properties`
3. Ensure PostgreSQL is running and database is created
4. Run the application using IntelliJ's Spring Boot run configuration

**Database Configuration:**
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/logiflow
spring.datasource.username=your_db_username
spring.datasource.password=your_db_password
spring.jpa.hibernate.ddl-auto=create
```

**Additional Required Settings:**
Before running the application, configure these settings in `application.properties`:

```properties
# Cloudinary Configuration (for file uploads)
cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret

# OCR Configuration (Tesseract)
ocr.tessdata.path=C:/Program Files/Tesseract-OCR/tessdata

# Mistral AI Configuration
spring.ai.mistralai.api-key=your_mistral_api_key

# Email Configuration (SMTP)
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password

# PayPal Configuration (Sandbox)
paypal.client.id=your_paypal_client_id
paypal.client.secret=your_paypal_client_secret
```

**OCR Setup (Tesseract):**
The application uses Tesseract OCR for document processing. Install Tesseract OCR:
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to default location: `C:\Program Files\Tesseract-OCR\`
3. Download language data files (`eng` and `vie`) to the `tessdata` folder
4. Verify the path in `application.properties` matches your installation

### 2. Web Frontend (React) - Command Prompt

**Requirements:**
- Node.js 18+
- npm or yarn

**Setup Steps:**
1. Open Command Prompt and navigate to the `client` directory
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open browser to `http://localhost:5173`

**Available Scripts:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### 3. Mobile App (Flutter) - Android Studio

**Requirements:**
- Flutter SDK 3.9.2+
- Dart SDK 3.9.2+
- Android Studio with Flutter plugin
- Android device/emulator or iOS device/simulator

**Setup Steps:**
1. Open the `client_mobile` directory in Android Studio
2. Update API configuration: Open `lib/services/api_client.dart` and change the `baseUrl` to your computer's IP address (replace `192.168.1.60` with your IP)
3. Ensure Flutter SDK is properly configured
4. Run `flutter pub get` to install dependencies
5. Connect Android device or start emulator
6. Run the app from Android Studio

**API Configuration:**
The mobile app connects to the backend API. Update the IP address in `lib/services/api_client.dart`:
```dart
static const String baseUrl = 'http://YOUR_IP_ADDRESS:8080/api';
```
To find your IP address, run `ipconfig` in Command Prompt and use your network adapter's IPv4 address.

**Development Commands:**
- `flutter pub get` - Install dependencies
- `flutter run` - Run on connected device/emulator
- `flutter build apk` - Build Android APK

## 📱 Usage

### Backend API
- Base URL: `http://localhost:8080`
- API documentation available at `/swagger-ui.html`
- Authentication required for most endpoints

### Web Application
- Access at `http://localhost:5173`
- Login with appropriate user credentials
- Different dashboards for Admin, Dispatcher, Driver, and Customer roles

### Mobile Application
- Install on Android/iOS device
- Login with driver or customer account
- Real-time GPS tracking and notifications

## 🏗️ Project Structure

```
logiflow/
├── server/                      # Backend (Spring Boot)
│   ├── src/main/java/com/logiflow/server/
│   │   ├── controllers/         # REST API endpoints
│   │   ├── services/           # Business logic
│   │   ├── models/             # JPA entities
│   │   └── repositories/       # Data access layer
│   └── src/main/resources/application.properties
├── client/                      # Web Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # React components
│   │   └── services/           # API services
│   └── package.json
└── client_mobile/              # Mobile App (Flutter)
    ├── lib/
    │   ├── screens/           # UI screens
    │   ├── services/          # API services
    │   └── models/            # Data models
    └── pubspec.yaml
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
