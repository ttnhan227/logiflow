# LogiFlow – Technical Overview

## Problem Context
Heavy freight logistics involves strict scheduling, compliance rules, port coordination, and tonnage constraints. Manual dispatching leads to inefficiencies, compliance risks, and lack of operational visibility.

## Solution
LogiFlow is an intelligent logistics management system designed for heavy cargo transport (containers, bulk freight, machinery). The platform provides:
- **Smart driver assignment** based on capacity, availability, compliance status, and proximity
- **OCR-based driver license verification**
- **Real-time GPS tracking** and route visualization
- **Delay management workflow** with approval process
- **Compliance-aware trip start validation**

## Core Roles
- **Admin**: System configuration and oversight
- **Dispatcher**: Order management and driver assignment
- **Driver**: Trip execution and status reporting
- **Customer (B2B)**: Order placement and tracking

## Tech Stack
- **Backend**: Spring Boot
- **Database**: PostgreSQL + PostGIS
- **Frontend**: React (Web), Flutter (Mobile)
- **OCR**: Tesseract
- **Payments**: PayPal Sandbox
- **Email**: SMTP

## System Architecture & Data Model
For visual details on the system structure and database design, refer to:
- [Architecture Diagram](./architecture-diagram.png)
- [ER Diagram](./er-diagram.png)
