# Rateway Support System

> **Operational Sub-system for Hospitality Management & Channel Onboarding**  
> Designed for standalone operation and seamless integration into the corporate **Rateway RMS (Rate Management System)**.

---

## 1. Overview & System Mission

The **Rateway Support System** is an operational workspace engineered specifically for revenue management, hotel operations, and OTA distribution teams. It serves as the primary system of record for hotel onboarding, sales channel configuration matrices, extranet credentials (vault), and operational support demands.

### Key Capabilities:
- **Client Sheet 360° & 10-Module Checklist**: Comprehensive hotel onboarding specification (legal & tax IDs, usability-tagged contacts, systems & channels, physical structures & multi-meal regimes, room inventory & bed layouts with alternative configurations, 33-item room amenities matrix with category checkboxes and inline specifications, guest entry methods, housekeeping frequencies, cancellation & quiet hours policies, OTA banking & direct payments, regional access points, and sales copywriting specs). Includes intelligent per-field status indicators, private internal team notes, 1-click WhatsApp pending summary generation, and canonical PDF export.
- **Cadastros Module (Distribution Matrix & Priorities Queue)**: Interactive crosshair matrix (Hotels $\times$ Channels) with canonical non-chromatic state icons (`Minus`, `CircleDashed`, `CircleDot`, `CircleArrowRight`, `CircleCheck`) and a deadline-prioritized onboarding queue with bottleneck tracking.
- **Demands Engine**: Kanban and list-based operational ticket tracking with subtasks, collective approvals, and completely decoupled direct link attachments (auto-detecting Google Drive/Docs with zero third-party OAuth popups).
- **Home Dashboard & Notice Board**: Realtime operational KPIs ("Clientes em cadastro", "Canais atrasados", "Demandas abertas", "Finalizadas na semana"), active channel deployment progress, "Minhas Demandas" quick widget, and administrative broadcast notices with per-user acknowledgment ("Ciente").
- **Encrypted Credential Vault**: Per-client extranet access storage protected by authenticated `AES-256-GCM` encryption.
- **Sub-Second Realtime Synchronization**: Powered by a dedicated Socket.IO event bus keeping all active team members in continuous sync.

---

## 2. Technical Handover for the RMS Agent

This section provides the essential knowledge for the engineer or AI agent implementing this sub-system into the **Rateway RMS (Rate Management System)**.

### A. Architecture & Technology Stack
- **Framework**: Next.js 16 (App Router with Server Actions).
- **Database ORM**: Prisma 7 with `@prisma/adapter-pg` native PostgreSQL connection pool.
- **Authentication**: Better-Auth with 2FA / TOTP (Google Authenticator) and role-based access control (Administrador, Operador, Visualizador).
- **Styling & Components**: Tailwind CSS v4, Lucide Icons, and custom design tokens adhering to strict ergonomic laws (detailed in Section 5 below).
- **Tab Lifecycle**: Keep-alive client state store (`src/features/shell/tabs-store.ts`) preserving unsaved form states across tab switches.
- **PDF Engine**: Client-side `jspdf` + `jspdf-autotable` generating 100% formatted, ready-to-print onboarding documentation with custom property logos and status badges.

### B. Database Models & Schema Architecture

All database tables are defined in `prisma/schema.prisma` and versioned via `prisma/migrations/`:

| Model | Table | Purpose |
| :--- | :--- | :--- |
| `InstanceSettings` | `system_settings` | White-label instance identity, logos, code masks (`{SIGLA}-{SEQ:3}`), and WhatsApp message templates. |
| `Client` | `clients` | Hospitality client profile (legal name, trade name, tax IDs, city, state, website, contact/finance phone). |
| `ClientChecklist` | `client_checklists` | Hotel onboarding data stored as structured JSONB (`data`), field approval/rejection metadata (`metadata`), and status (`rascunho`, `em_revisao`, `aprovado`). |
| `ChannelDeployment` | `channel_deployments` | Channel rollout state for each Client $\times$ Channel pair (`NAO_INICIADO`, `DADOS_ENVIADOS`, `EM_ANALISE`, `NO_AR`, `PAUSADO`), direct listing URLs, channel IDs, and operational notes. |
| `Demand` | `demands` | Operational tickets with status (`aberta`, `em_andamento`, `bloqueada`, `concluida`, `cancelada`), priorities, SLAs, and assignees. |
| `VaultCredential` | `vault_credentials` | Secure credential store per client and service, encrypted with `AES-256-GCM`. |
| `CatalogItem` | `catalog_items` | Master catalog of OTA channels (Booking.com, Airbnb, Expedia, etc.), Channel Managers (FOCO, Omnibees, etc.), PMSs, and internal services. |
| `User` / `Session` | `users` / `sessions` | Authentication, password hashes, and session management. |

### C. The 10-Module Checklist Specification (`ChecklistData`)

The `ClientChecklist.data` column stores the exhaustive `ChecklistData` JSON object with strict TypeScript typing (`src/features/checklist/types.ts`):

1. **Module 01 (Identificação)**:
   - Legal entities: `razaoSocial`, `nomeFantasia`, `cnpj`, `inscMunicipal`, `inscEstadual`, `cadastur`, `nire`.
   - Property details: `titularNome`, `titularCpf`, `tipoPropriedade`, `totalUnidades`, `inauguracao`, `ultimaReforma`, `reformaDesc`.
   - Location: `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `mapsLink`, `comoChegar`.
   - Team: `idiomas` (multi-select).
2. **Module 02 (Contatos)**:
   - Dynamic phone numbers with purpose labels (`telefones: PhoneItem[]`).
   - Dynamic official email addresses with purpose tags (`emails: EmailItem[]`).
   - Reception schedule: `recepcao24h` (boolean) or conditional opening hours (`recepcaoInicio`, `recepcaoFim`).
   - Responsible persons with approval authority scopes (`responsaveis: ResponsibleItem[]`).
3. **Module 03 (Canais e Sistemas)**:
   - Channel status tags (`Já possui`, `Revisão / Cadastro` with Link, ID, and Acessos, `Não contratado`).
   - External systems: `usaFoco` toggle. When other system: 2-column external Channel Manager and PMS fields (`cmNome`, `cmObs`, `pmsNome`, `pmsObs`).
   - Simplified property website URL (`sitePropriedade`).
4. **Module 04 (Instalações e Serviços)**:
   - **Multi-select Meal Regimes (`regimesAlimentacao`)**: *Só acomodação*, *Café da manhã incluso*, *Café da manhã pago à parte*, *Meia pensão (com almoço)*, *Meia pensão (com jantar)*, *Pensão completa*, *All inclusive*.
   - Breakfast details: format (`cafeTipo`), hours (`cafeInicio`, `cafeFim`), and individual pricing (`cafeValor`).
   - Lunch and dinner hours for half/full board.
   - Parking details: free/paid (`estac`), daily rate (`estacValor`), spot type (`estacTipo`: rotativo, demarcada, conveniado), covered/uncovered, total spots, advance reservation.
   - Wi-Fi coverage: free everywhere, common areas only, rooms only, paid, none.
   - **Common Area Facilities (`facilidades`)**: 28 standard facilities (Piscina, Restaurante, Lavanderia, Academia, Sauna, etc.) where checking any item opens an interactive detail input (`det`) with canonical operational prompts (hours, rules, equipment).
5. **Module 05 (Acomodações)**:
   - Room categories (`categorias: RoomCategoryItem[]`) with category type, physical unit count, square meters, floor, and view.
   - Maximum adult, child, and standard occupancy (`ocupMax`, `ocupPadrao`).
   - Multi-bed configurations with complete bedding types: `casal`, `queen`, `king`, `solteiro`, `beliche`, `treliche`, `sofa`, `camaAuxiliar`, and `outro` with custom description and notes.
   - Shared dormitories (lockers, gender, internal bathroom) and entire home properties.
   - Unit-level differences (`difs: UnitDiff[]`).
6. **Module 06 (Comodidades dos Quartos)**:
   - 33 canonical room amenities grouped into Climatização, Banheiro, Entretenimento, Cozinha, Vista, Amenities e Acessibilidade.
   - 3-state selector: `todas`, `algumas`, `nenhuma`.
   - When `algumas` is selected, renders category checkboxes linking directly to Module 05 rooms.
   - Inline specification inputs (`det`) for items requiring operational details (e.g. AC hot/cold, TV size/cable).
7. **Module 07 (Políticas)**:
   - Check-in/check-out hours, early check-in and late check-out fees/policies.
   - Guest entry methods (`metodoAcesso`): 24h reception, digital locks (codes), lockboxes, smart mobile apps, RFID cards, keys in person.
   - Housekeeping policies: cleaning frequency during stay (`limpezaFrequencia`), bed linen and towel exchange frequency (`trocaEnxoval`), and stay cleaning fee (`taxaLimpezaEstadia`).
   - Age restrictions, required documentation pills, unaccompanied minors rules.
   - Dynamic child age pricing tiers (`criancas: ChildAgeRule[]`) and crib options.
   - Tiered cancellation refund schedule (`cancelamento: CancellationRule[]`), no-show penalty, and security deposits.
   - Pet policies (allowed sizes, max quantity, daily fee, rules), smoking policies, quiet hours, and municipal tourism taxes.
8. **Module 08 (Pagamentos e Comissões)**:
   - Accepted on-site counter payment methods and card brand pills.
   - Dynamic direct payment installment plans (`planos: PaymentPlanItem[]`).
   - OTA repasse bank accounts (bank code, agency, account with digit, account type, PIX key).
9. **Module 09 (Localização e Arredores)**:
   - Nearest commercial airport and bus terminal with distances/travel times.
   - Dynamic points of interest list (`pontos: PointOfInterest[]`) with category and distances.
   - Regional driving routes and recurring local festivals.
10. **Module 10 (Textos de Venda e Fotos)**:
    - Central Google Drive root photo folder and per-category sub-folders.
    - Marketing copywriting (short description, full listing description, space overview, neighborhood, transit tips).
    - Competitive differentiators and target audience demographics.

### D. Cadastros Module (Distribution Matrix & Queue)
- **Matrix View**: Cross-reference between active clients and sales channels. Cells display non-chromatic state icons indicating exact status.
- **Queue View**: Prioritized operational pipeline displaying channels grouped by urgency, days elapsed in current state, and delayed deadlines.
- **Rollout Transitions**: Handled via `src/features/cadastros/actions.ts` with server-side audit logs.

### E. Credential Vault Cryptography
- Extranet credentials stored in `vault_credentials` are encrypted using authenticated `AES-256-GCM`.
- Encryption key: Provided via `VAULT_ENCRYPTION_KEY_V1` (32 bytes base64-encoded).
- Encryption helper functions located in `src/features/vault/crypto.ts`:
  - `encryptCredential(plainText: string): Promise<{ ciphertext: string; iv: string; tag: string; version: number }>`
  - `decryptCredential(record: VaultCredentialRecord): Promise<string>`

### F. Recommended RMS Integration Endpoints & Interfaces
1. **Hotel Ingestion**:
   Query client with associated checklist:
   ```typescript
   import { prisma } from "@/lib/db";
   
   const clientWithData = await prisma.client.findUnique({
     where: { id: clientId },
     include: {
       checklist: true,
       deployments: { include: { channel: true } },
       credentials: true,
     },
   });
   ```
2. **Tariff & Inventory Sync**:
   - Access room types and bed capacities via `clientWithData.checklist.data.categorias`.
   - Access meal regimes and breakfast rates via `clientWithData.checklist.data.regimesAlimentacao` and `clientWithData.checklist.data.cafeValor`.
3. **Channel Mapping**:
   - Channel deployment states accessed via `clientWithData.deployments`.

---

## 3. Getting Started & Clean Setup

### Prerequisites
- **Node.js**: v20 or v22 LTS (tested up to v24)
- **PostgreSQL**: 16+
- **Package Manager**: `npm`

### Clean Installation Step-by-Step

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NadsonFraga/rateway-support-system.git
   cd rateway-support-system
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Generate cryptographic keys:
   ```bash
   npm run gerar-chaves
   ```
   Ensure `DATABASE_URL`, `VAULT_ENCRYPTION_KEY_V1`, `VAULT_ACTIVE_KEY_VERSION=1`, and `BETTER_AUTH_SECRET` are properly set.

3. **Deploy database migrations**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Seed initial administrator (Clean Database)**:
   ```bash
   npm run semente -- --instancia "Central de Operações Rateway" --nome "Seu Nome" --usuario admin --email admin@rateway.com.br
   ```
   *Note: This creates the white-label instance and the administrator account. No test hotel records are generated.*

5. **Start development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Automated Testing & Verification

The project enforces a strict zero-regression policy across all unit and integration test suites:

```bash
# Typecheck TypeScript (zero diagnostics policy)
npm run typecheck

# Run unit & integration test suites (Vitest)
npm test

# Run end-to-end browser tests (Playwright)
npm run test:e2e
```

---

## 5. Design System & Ergonomic Laws

The user interface follows strict operational standards designed for desktop-first hotel operations:
- **95% Monochromatic Palette**: Functional neutral graphite (`#1c1c1d`) with pure white/neutral surfaces and discrete line borders.
- **Non-Chromatic Semantics**: Avoids ambiguous colored pills; states are communicated via explicit typography and unambiguous geometric icons.
- **Zero Floating Toasts & Zero FABs**: All operational feedback is contained directly within triggering buttons and inline state containers.
- **44px Touch Targets**: Uniform list row and button heights engineered for rapid keyboard-first and mouse-based operational throughput.
