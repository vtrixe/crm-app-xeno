# Mini CRM

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Authorization](#authorization)

## Overview
A full-stack marketing campaign management system with real-time processing capabilities built using Node.js, TypeScript, React, and modern messaging architecture.

## Architecture
```
root/
├── backend/
│   ├── config/         # Configuration files
│   ├── services/       # Business logic
│   ├── consumers/      # Message queue consumers
│   ├── controllers/    # Request handlers
│   ├── routes/         # API routes
│   ├── middlewares/    # Custom middlewares
│   ├── types/          # TypeScript types
│   └── app.js         # Application entry point
├── frontend/
│   ├── pages/         # React pages
│   ├── components/    # Reusable components
│   └── context/       # Auth context
└── infra/            # Infrastructure setup
```

## Technologies
- **Backend**: Node.js + TypeScript
- **Frontend**: React
- **Message Queue**: RabbitMQ
- **Cache**: Redis
- **Database**: MySQL with Prisma ORM
- **Architecture**: Pub/Sub + Consumer Pattern

## Getting Started

### Prerequisites
- Node.js >= 14
- Docker & Docker Compose
- MySQL
- Redis
- RabbitMQ

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/project-name.git
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd my-app
npm install
```

4. Start infrastructure services
```bash
cd infra
docker-compose build
docker-compose up
```

## API Documentation

### Campaign Management
**Base path:** `/api/campaign`

| Method | Endpoint | Access Roles | Description |
|--------|----------|--------------|-------------|
| POST | `/` | Admin, Manager | Create new campaign |
| GET | `/` | All authenticated | List campaigns |
| GET | `/:id` | All authenticated | Get campaign details |
| PUT | `/:id` | Admin, Manager | Update campaign |
| PATCH | `/:id/status` | Admin, Manager | Update campaign status |
| PUT | `/:id/stats` | Admin, Manager | Update campaign statistics |
| DELETE | `/:id` | Admin | Delete campaign |

### Messaging System
**Base path:** `/api/message`

| Method | Endpoint | Access Roles | Description |
|--------|----------|--------------|-------------|
| POST | `/send` | Admin, Manager | Send campaign message |
| POST | `/delivery-status` | Admin, Manager | Update message delivery status |
| GET | `/campaign/:campaignId/stats` | Admin, Manager | Get campaign message statistics |
| GET | `/list` | Admin, Manager | List all messages |

### Data Ingestion
**Base path:** `/api/data-ingestion`

#### Customer Endpoints
| Method | Endpoint | Access Roles | Description |
|--------|----------|--------------|-------------|
| POST | `/customers` | Admin, Manager | Ingest customer data |
| GET | `/customers` | Admin, Manager, Viewer | List all customers |
| GET | `/customers/metrics` | Admin, Manager | Get customer metrics |
| GET | `/customers/:id` | Admin, Manager, Viewer | Get customer details |
| PUT | `/customers/:id` | Admin, Manager | Update customer |
| DELETE | `/customers/:id` | Admin | Delete customer |

#### Order Endpoints
| Method | Endpoint | Access Roles | Description |
|--------|----------|--------------|-------------|
| POST | `/orders` | Admin, Manager | Ingest order data |
| GET | `/orders` | Admin, Manager, Viewer | List all orders |
| GET | `/orders/metrics` | Admin, Manager | Get order metrics |
| GET | `/orders/:id` | Admin, Manager, Viewer | Get order details |
| PUT | `/orders/:id` | Admin, Manager | Update order |
| DELETE | `/orders/:id` | Admin | Delete order |

### Audience Segmentation
**Base path:** `/api/audience-segmentation`

| Method | Endpoint | Access Roles | Description |
|--------|----------|--------------|-------------|
| POST | `/segments` | Admin, Manager | Create audience segment |
| PUT | `/segments/:id` | Admin, Manager | Update segment |
| DELETE | `/segments/:id` | Admin, Manager | Delete segment |
| GET | `/segments` | All authenticated | List segments |
| GET | `/segments/:id` | All authenticated | Get segment details |
| POST | `/segments/:id/validate-size` | Admin, Manager | Validate segment size |

### Metrics
**Base path:** `/api/metrics`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer` | Get customer metrics |
| GET | `/order` | Get order metrics |
| POST | `/calculate/:type` | Calculate specific metric type |

## Authorization

### Role Hierarchy
1. **Admin**: Full system access
2. **Viewer**: Basic read access

### Security Features

#### Authentication Middleware
- Session-based authentication
- OAuth 2.0 with Google
- Session cookie management

#### Authorization Middleware
- Role-based access control (RBAC)
- Endpoint-specific role requirements
- Granular permission control

