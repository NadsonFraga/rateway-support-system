# Rateway Support System — RMS Integration Guide

This guide describes how the **Rateway Support System** integrates with the main **Rateway Rate Management System (RMS)**. It details authentication sharing (SSO / JWT), embedding options (iframe, micro-frontend, direct incorporation), and role-based access control (RBAC) mapping.

---

## 1. Architectural Overview

The Rateway Support System is designed as an operational sub-system inside the Rateway hospitality ecosystem. While it operates autonomously with its own database schema, domain models, and realtime Socket.IO server, it is engineered to be embedded directly into the corporate RMS interface or accessed via seamless single-sign-on.

```
+-------------------------------------------------------------+
|                      Rateway RMS (Parent)                   |
|                                                             |
|  +-------------------------------------------------------+  |
|  |  Navigation: Dashboard | Rates | Analytics | Support  |  |
|  +-------------------------------------------------------+  |
|                               | (Click Support)             |
|                               v                             |
|  +-------------------------------------------------------+  |
|  |          Embedded Rateway Support System Frame        |  |
|  |  - Início (Dashboard & Team Notices)                  |  |
|  |  - Demandas (Kanban, List, Filters, Drawer)           |  |
|  |  - Clientes (Ficha 360°, 10-Module Checklist, Vault)  |  |
|  |  - Cadastros (General Matrix & Priority Queue)        |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

---

## 2. Authentication & Single Sign-On (SSO)

### 2.1 The SSO Token Handshake

When a user in the RMS navigates to the Support System, the RMS generates a signed JSON Web Token (JWT) using a shared secret (`RMS_JWT_SECRET`) and redirects or loads the Support System URL:

```
GET https://support.rateway.internal/auth/sso?token=<JWT_TOKEN>&redirect=/clientes/101
```

#### JWT Payload Specification
```json
{
  "sub": "rms_user_uuid_12345",
  "email": "analyst@rateway.com.br",
  "name": "Mariana Santos",
  "role": "analyst",
  "iat": 1731438000,
  "exp": 1731441600,
  "iss": "rateway-rms"
}
```

### 2.2 Token Validation & Session Provisioning

The Support System server route verifies the token:
1. Validates signature with `RMS_JWT_SECRET` (HMAC SHA-256) and checks `exp` expiration window.
2. Checks whether a user with `email` exists in the `users` table:
   - If not found, provisions a new `User` record with `name`, `email`, and the mapped role.
   - If found, syncs the user's name and updates active status.
3. Issues a secure `session` cookie (compatible with Better Auth / HTTP-only) and redirects to the requested path (or default home `/`).

### 2.3 Standalone Development Mode
For local development and testing, the Support System retains its built-in authentication provider (Better Auth) with two-factor authentication (2FA) and password policies, allowing engineers to work without spinning up the main RMS.

---

## 3. Embedding Strategies

### Option A: Clean iframe Embedding (Recommended)
The Support System can be embedded inside an RMS view via an `<iframe>`:

```html
<iframe
  src="https://support.rateway.internal/auth/sso?token=..."
  class="w-full h-full border-0"
  allow="clipboard-write; clipboard-read"
/>
```

#### PostMessage Bridge
The Support System communicates with the parent RMS window using standard `window.postMessage`:
- **Navigation Sync**: Reports route changes to keep the parent browser URL synchronized.
  ```ts
  window.parent.postMessage({ type: "RATEWAY_SUPPORT_NAVIGATE", path: "/cliente/101" }, "*");
  ```
- **Badge Counters**: Reports unread notices and active urgent demands to the parent sidebar badge:
  ```ts
  window.parent.postMessage({ type: "RATEWAY_SUPPORT_COUNTERS", urgentDemands: 2, unreadNotices: 1 }, "*");
  ```

### Option B: Micro-Frontend / Reverse Proxy
The RMS gateway (e.g., Nginx, Envoy, or Cloudflare Workers) routes `/support/*` directly to the Support System application container. In this setup, cookies and domains are shared natively without cross-origin iframe boundaries.

---

## 4. Role-Based Access Control (RBAC) Mapping

The Support System enforces granular permission boundaries. RMS roles map directly to Support System roles:

| RMS Role | Support System Role | Permissions Summary |
|---|---|---|
| `superadmin`, `director` | `administrador` | Full system access, team notices broadcast, catalog management, system settings, member audit. |
| `onboarding_lead`, `revenue_manager` | `analistaImplantacao` | Client onboarding, checklist updates, channel matrix deployment status, demands execution, vault management. |
| `support_agent`, `operator` | `membro` | View clients, manage assigned demands, checklist viewing, status updates. |
| `read_only_auditor` | `visualizador` | Read-only access across demands, clients, and matrices. Cannot modify statuses or vault secrets. |

---

## 5. Deep Linking & Query Parameters

The Support System supports deep linking into any entity:

- **Client Sheet 360°**: `/app?tab=cliente&codigo=101`
- **Checklist Sub-tab**: `/app?tab=cliente&codigo=101&subtab=checklist`
- **Demand Drawer**: `/app?demanda=D-0042`
- **Cadastros General Matrix**: `/app?tab=cadastros&view=matriz`
- **Cadastros Priority Queue**: `/app?tab=cadastros&view=prioridades`
