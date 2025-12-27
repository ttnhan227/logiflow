Software Requirements Specification (SRS)
Version 1.2
LogiFlow – Intelligent Driver Assignment System for Logistics
---
1.1 Background and Necessity for the Full-Stack Web Application
In the heavy logistics industry, managing fleet assignments manually leads to severe inefficiencies. Unlike small parcel delivery, heavy transport involves strict schedules, port entry permits, warehouse dock coordination, and compliance with heavy tonnage regulations.
Dispatchers currently struggle to coordinate container trucks and heavy lorries via phone, leading to port congestion charges (detention/demurrage), warehouse dock conflicts, fuel wastage, and lack of visibility. Compliance with transportation laws is critical; drivers often exceed safe driving hours, and manual license verification is prone to errors.
To address these challenges, LogiFlow is needed to digitize the heavy transport workflow with intelligent driver assignment, automate OCR-based driver verification, optimize container and heavy cargo routing, and manage real-time delay handling.
---
1.2 Proposed Solution
The proposed solution is an Intelligent Logistics Management System named LogiFlow, developed to manage the transport of containers and heavy cargo (measured in Tons) using smart driver assignment and route optimization. The system specializes in heavy freight logistics, handling pickups from port terminals and warehouses, delivering to B2B customers (companies, factories, distribution centers).
The system involves five main user roles:
Admin (Web): Oversees the entire system, manages configurations, and handles Driver Onboarding (verification & account creation).
Dispatcher (Web): Intelligently assigns trips to drivers based on capacity, availability, compliance, and proximity; validates delay requests; monitors route progress on maps.
Customer (Mobile/Web): Company users request cargo transport from ports or warehouses, specify pickup details (container numbers for ports, dock preferences for warehouses), view distance (km) and routes, and receive real-time status updates (including delay justifications).
Driver (Mobile): Receives container and heavy cargo hauling jobs, reports delay reasons, and tracks work compliance.
Key Operational Shifts:
Cargo Focus: The system manages heavy freight (containers, bulk cargo, heavy machinery) transported by trucks (Container Trucks, Tractor Units, Heavy Lorries), measured by tonnage capacity. This is not a small parcel delivery system.
Pickup Sources: Orders can originate from:
Port/Harbor Terminals: Container pickup with container number tracking and port gate management
Warehouses: Heavy cargo pickup with simple dock information and pickup time coordination
Customer Model: Customers are B2B companies (not individual consumers). Each customer account includes company information, and delivery addresses are industrial locations (warehouses, factories, construction sites).
Onboarding: Drivers cannot self-register. They submit documents via the app for OCR extraction, which HR/Admin verifies before creating their account.
Pricing: Pricing is hidden during order creation (handled via contracts); the focus is on Distance (KM) and Route confirmation.
---
1.3 Purpose of the Document
This document defines the SRS for LogiFlow. It outlines an intelligent logistics system specializing in heavy cargo transport (containers and heavy freight), with smart driver assignment, dual pickup sources (ports and warehouses), B2B customer focus, strict time compliance, OCR technologies for documentation, and exception handling for delays. It serves as a guide for developers (Nhân, Vĩ, Phát, Anh) and stakeholders.
---
1.4 Scope of the Project
LogiFlow serves as a centralized platform for intelligent heavy freight logistics. The system includes modules for:
Advanced User Authentication & OCR verification
Company & Customer Management: B2B customer accounts with company information
Heavy Cargo Order Management (Tons/Containers) with pickup type specification (Port vs Warehouse)
Port Operations: Container number tracking, port gate management, detention/demurrage awareness
Warehouse Pickup Coordination: Simple dock information and pickup time windows (not full warehouse management)
Fleet Management (Heavy Trucks/Trailers) with tonnage capacity matching
Driver Performance Scoring & Monitoring
Intelligent Trip Assignment & Visual Route Mapping
Delay Management Workflow (Driver Report → Admin Extension → Customer Notify)
Work Logs & Heavy Vehicle Compliance
Reporting & Analytics
---
1.5 Constraints
Browser/Device: Compatible with major browsers and ruggedized mobile smartphones used by truck drivers.
Real-time: GPS tracking must handle long-haul routes with high accuracy.
Data Accuracy: OCR (Optical Character Recognition) must accurately extract text from Driver Licenses and Vehicle Registration images.
Time Synchronization: Server time must be strictly synced to prevent drivers from starting trips early/late.
---
1.6 Functional Requirements
The system will support five main user roles: Admin, Dispatcher, Driver, and Customer. Each role has specific permissions and access levels, defined as follows:
Admin (Nhân)
Manage driver onboarding: Receive applications with license photos, use OCR to extract details (number, expiry, class), verify, and manually create accounts (no self-registration).
Manage user accounts: Create, edit, deactivate, or delete accounts with permissions for all user roles.
Approve/reject requests: Review drivers/customers registrations.
Trip & Order Oversight: Monitor all trips and orders in real-time, review delay reports, approve/reject delay requests with SLA extensions, override trip statuses when needed, view detailed trip information (driver, vehicle, route, orders, compliance status), and track order fulfillment across the system.
System configuration & integrations: Adjust route preferences, rest policies, notifications, security, and set up GPS/map/third-party services.
Monitor activity & backups: View logs, alerts, and schedule data backup/restoration.
Access dashboards: View trips, utilization, availability, compliance alerts.
Generate reports: Export metrics, compliance, delay analyses, usage.
Dispatcher (Vĩ)
Order & route management: Handle bulk cargo orders (tons) from port terminals or warehouses, create/import orders with pickup type specification, capture container numbers (for port pickups) or dock information (for warehouse pickups), and view specific visual routes on maps.
Intelligent Trip Assignment: Assign to drivers using smart matching that validates tonnage capacity, driver availability, rest/compliance status, license type, and proximity to pickup location.
Monitor progress: Track real-time container and heavy cargo deliveries, manage rerouting, cancellations.
Handle priorities & communication: Process urgent hauls with custom rules, chat/send notifications.
Verify completion: Confirm via signature/OTP/photo at delivery location.
Generate reports: Compile daily stats, performance, delays.
Driver (Phát)
Application verification: Submit license photo; OCR extracts details; admin approves account.
Trip management: View hauls with tonnage, pickup type (port/warehouse), pickup details (container numbers for ports, dock info for warehouses), routes, ETAs; accept/decline.
Real-time navigation & updates: Access maps, receive notifications, report progress (departed, loaded, delivered).
Delay reporting: Seamlessly report reasons mid-trip (port congestion, warehouse loading delays, traffic, breakdowns); admin reviews for extensions.
Compliance tracking: Auto-record work/rest; view history, performance, next available time.
Communication: Chat with dispatcher.
Proof of delivery: Capture delivery signatures, photos at customer location.
Maintenance reminders: Receive notifications for vehicle checks, repairs, or inspections.
Customer (Anh)
Company Account: Users belong to a company (B2B entity). Company information is stored with customer account.
Specify Pickup Type: Port Terminal OR Warehouse
For Port Pickups: Input container details (container numbers, size, tonnage), port terminal and gate information
For Warehouse Pickups: Input cargo details (size, tonnage, description), warehouse location and dock preferences
Input B2B delivery address (industrial location with dock/loading bay if applicable)
View distance (km) and routes
No price shown (handled via contracts)
Track real-time order status: Monitor progress (pending, at port/warehouse, loaded, in transit, delivered) with detailed status updates.
View order history: Access past transactions and delivery records for the company.
Receive notifications and alerts: Get updates for order changes, delays (e.g., 'Driver delayed due to Port Congestion. New ETA: +15 mins'), or confirmations.
Manage user account: Update company information, delivery addresses, and linked contracts for heavy cargo logistics.
---
1.7 Non-Functional Requirements
Reliability: High availability during peak port operation hours and warehouse operating hours.
Performance: OCR processing for licenses should take < 5 seconds.
Scalability: Support management of up to 200 heavy trucks simultaneously.
Accuracy: GPS routing must utilize mapping data for route visualization and ETA calculation
---
1.8 Interface Requirements
Hardware: Server/Admin PC (Intel Core i5+, 8GB RAM). Driver Device (Android Smartphone with Camera).
Software & Tech Stack:
Frontend: ReactJS (Web), React Native/Flutter (Mobile)
Backend: Spring Boot (Java)
Database: PostgreSQL (with PostGIS)
AI/OCR: Tesseract OCR or Google Cloud Vision API
Maps: Mapbox or Google Maps Platform
---
1.9 Project Deliverables
Complete source code (Web & Mobile).
OCR Integration Module for license verification.
Database schema including Driver Performance and Delay Log tables.
Deployment-ready application.
Documentation: SRS, DFD, ERD.
Demo video showcasing the Delay Workflow and Constraint-based 'Start Trip' logic.
