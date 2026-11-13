# Rateway Support System — Architecture & Deployment Guide

This guide describes the technical architecture, realtime infrastructure, environment configuration, and production deployment protocols for the Rateway Support System.

---

## 1. System Architecture

The application is structured as a modern full-stack TypeScript project running on **Next.js 16 (App Router)** and **PostgreSQL**.

```
+-------------------------------------------------------------------------+
|                                CLIENT                                   |
|  - Next.js App Router (React 19 Server & Client Components)             |
|  - Multi-tab Application Shell (Tabs Store & Keep-Alive Context)         |
|  - Realtime Hook (Socket.IO client with auto-reconnection)              |
|  - Decoupled Link Manager (Zero third-party OAuth popups)               |
+-------------------------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          | HTTPS (RSC / Server Actions)                      | WSS (WebSockets)
          v                                                   v
+-----------------------------+             +-----------------------------+
|    NEXT.JS APPLICATION      |             |    SOCKET.IO SERVER         |
|  - Server Actions & Guards  |             |  - Topic pub/sub bus        |
|  - Better Auth + RMS SSO    |             |  - Room broadcasting        |
|  - AES-256-GCM Vault Engine |             |  - Heartbeat & Presence     |
|  - Prisma Client ORM        |             |                             |
+-----------------------------+             +-----------------------------+
          |                                                   |
          +-------------------------+-------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         POSTGRESQL DATABASE                             |
|  - Relational Models (Clients, Checklists, Deployments, Demands)        |
|  - Monotonic Sequences (101, D-0042)                                    |
|  - Concurrency Locks (EditLock)                                         |
+-------------------------------------------------------------------------+
```

### Key Architectural Tenets:
1. **Decoupled Architecture**: Zero Google Cloud OAuth or Picker dependencies. Any web link (Drive, Dropbox, OneDrive, Figma) is handled cleanly via direct URLs with domain auto-detection.
2. **Server Actions First**: Mutations run via validated `"use server"` actions with direct access to Prisma transactions and strict permission guards (`currentMember()`, `currentAdmin()`).
3. **Sub-second Realtime Sync**: Modifications publish event payloads to Socket.IO topics (`cadastros`, `checklist`, `demandas`, `clientes`, `dashboard`), triggering surgical re-renders across all connected operators.
4. **Canonical Design Laws**: Strict adherence to the 95% monochromatic graphite design system (`design-tokens-and-laws.md`), 44px touch targets, non-chromatic state icons, and zero floating toasts.

---

## 2. Environment Variables

Configure the following variables in your production environment (e.g., `.env.production` or container environment):

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/rateway_support?schema=public`). |
| `BETTER_AUTH_SECRET` | Yes | 32+ character random secret used for session signature and encryption. |
| `BETTER_AUTH_URL` | Yes | Canonical base URL of the support system (e.g., `https://support.rateway.internal`). |
| `VAULT_MASTER_KEY` | Yes | 64-character hex string (32 bytes) used for AES-256-GCM vault encryption. |
| `RMS_JWT_SECRET` | Yes | Shared secret for verifying Single Sign-On JWT tokens issued by the main RMS. |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | URL of the Socket.IO realtime server (e.g., `wss://support.rateway.internal`). |
| `NODE_ENV` | Yes | Set to `production`. |

> [!NOTE]
> All legacy `NEXT_PUBLIC_GOOGLE_*` variables have been permanently deprecated and eliminated from the codebase.

---

## 3. Realtime Server Operation

The realtime engine provides instantaneous event broadcasting across team members.

### Starting the Realtime Server:
In production, the Socket.IO server runs alongside or inside the application container:

```bash
# Start standalone realtime server
node server/realtime.js
```

### Subscribed Topics:
- `cadastros`: Channel deployment updates, go-live state changes, and bottleneck tags.
- `checklist`: 10-module onboarding field updates, progress calculations, and team notes.
- `demandas`: Ticket creations, status changes, assignee confirmations, and comments.
- `clientes`: Client record updates and service contract changes.
- `dashboard`: Team broadcast notices and acknowledgment events.

---

## 4. Production Deployment

### 4.1 Docker Containerization

#### Build Docker Image
```bash
docker build -t rateway-support-system:latest .
```

#### Run Container with Docker Compose
```yaml
version: '3.8'

services:
  app:
    image: rateway-support-system:latest
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/support_system
      - BETTER_AUTH_SECRET=${AUTH_SECRET}
      - BETTER_AUTH_URL=https://support.rateway.internal
      - VAULT_MASTER_KEY=${VAULT_KEY}
      - RMS_JWT_SECRET=${RMS_SECRET}
      - NEXT_PUBLIC_SOCKET_URL=https://support.rateway.internal
      - NODE_ENV=production
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      - POSTGRES_DB=support_system
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 4.2 Database Migrations & Seeding

Apply all database migrations before starting the application:

```bash
# Run production migration deploy
npx prisma migrate deploy

# Seed baseline catalogs (Channels, PMS, Channel Managers)
npx prisma db seed
```

### 4.3 Nginx Reverse Proxy Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name support.rateway.internal;

    ssl_certificate /etc/ssl/certs/support.rateway.crt;
    ssl_certificate_key /etc/ssl/private/support.rateway.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 5. Verification & Testing Protocol

Before promoting changes to production:

```bash
# 1. Typecheck the entire codebase
npm run typecheck

# 2. Run all unit and integration test suites
npm test

# 3. Run end-to-end automated tests
npm run test:e2e
```
