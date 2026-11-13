# Feature Plan: RMS Integration Preparation, Google Picker Decoupling, Modular Checklist & Core Modules Polish

## 1. Objective & Scope

### Objective
Reposition and polish the Rateway Support System as a dedicated, high-performance operational sub-system designed for seamless embedding/integration into the corporate Rateway RMS. Fully decouple from external third-party API dependencies (permanently removing the Google Picker API in favor of direct manual link attachments), deliver the refined 10-module Client Onboarding Checklist (with per-field intelligent status, WhatsApp pending-items copy, and zero math calculators), implement the Cadastros module (Channels Matrix & Priority Queue), integrate the Client Overview and Dashboard, and author comprehensive handoff documentation for the RMS engineering team.

### Scope
- **Included**:
  1. **Google Picker Decoupling & Clean Manual Attachments**:
     - Remove `src/features/demands/drive/drive-picker.tsx` and all external Google API script loaders (`apis.google.com`, `accounts.google.com/gsi/client`).
     - Remove Google Cloud environment variables (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_API_KEY`, `NEXT_PUBLIC_GOOGLE_PROJECT_NUMBER`) from `.env.example`, `.env.local`, and documentation.
     - Manual link attachment dialog: auto-detect Google Drive / Docs URLs to display dedicated Drive branding and enable one-click navigation to the Google Drive asset in a new tab without requiring Google authentication in the app.
  2. **Demands Module Finalization**:
     - Finalize and verify the demands module (which is currently fully functional in the working tree).
     - Ensure all unit tests (67+) and E2E tests pass cleanly with the decoupled attachment mechanics.
  3. **Modular Client Onboarding Checklist (`ClientTab` -> Checklist Sub-tab)**:
     - Structure the refined 10-module operational checklist:
       - **Module 1: Legal & Corporate Identification**: Razão Social, Nome Fantasia, CNPJ (with validation), Inscrição Municipal (with OTA note), Inscrição Estadual (optional), NIRE/Junta Comercial (optional with helper text), CADASTUR (optional with helper text), Legal Owner (Nome, CPF), Inauguration & Last Renovation (optional).
       - **Module 2: Contacts & Communication Channels**: Phone manager with multi-tag usability (`Recepção/Hóspede`, `Segurança/2FA/SMS Extranets`, `Financeiro/Cobrança`, `Emergência/Noturno`), Official Reservation Email, Financial Email, Key Contacts list. (Website moved to Media).
       - **Module 3: Channels & Management Systems**: Channel selection with clear states (`Já possui cadastro` [link, ID, access notes], `A cadastrar / Contratado` [routed to Cadastros pipeline], `Não contratado`). Systems setup (FOCO recognition hides redundant PMS access fields; non-FOCO PMS prompts for online/local mode; online booking engine link). Secure JSON export with `Hide sensitive credentials` toggle.
       - **Module 4: Physical Structure, Location & Operations**: Physical address with Google Maps link (single canonical field) and directions; Operating hours (Front desk 24h or open/close hours, Check-in window, Check-out window, early/late options); Hotel Meal Plans (Room Only, Breakfast Included, Half Board Breakfast+Lunch, Half Board Breakfast+Dinner, Full Board, All Inclusive); On-site Restaurant details (à la carte, room service, hours); Parking & Wi-Fi; Common area amenities (pool, sauna, gym, elevator, etc.).
       - **Module 5: Accommodations & Inventory**: Room categories (commercial name, selling type, room type, quantity, physical numbering, m², view); Occupancy limits (Adults, Children, Max total, Base occupancy); Bed configurations (Double, Queen, King, Single, Bunk, Sofa bed; Layouts A, B, C); Bathroom, shower water heating (gas, electric, solar), extra beds, wheelchair accessibility; Unit Differences (`difs` for unit-level exceptions).
       - **Module 6: Room Amenities Matrix**: 33 hotel amenities grouped logically, evaluated via 3-state selector (`Todas` / `Algumas` / `Nenhuma`) plus optional technical details.
       - **Module 7: Property Policies**: Cancellation terms & No-show policies; Children courtesies & baby cribs; Pet policy (acceptance, sizes, fees, rules); House rules (smoking, events, quiet hours 22:00-07:00, outside visitors); Optional municipal tourism tax (no 10% service fee or VAT/IVA).
       - **Module 8: Payments, Bank Details & Commercial Alignment**: Bank details for OTA payouts (Titular, CPF/CNPJ, Bank code/name, Agency, Account with digit, PIX); Direct payment methods accepted at front desk (PIX, Credit card with installments); Client Alignment Guide for OTA commissions & FOCO markup (zero math calculators; clear alignment checklist).
       - **Module 9: Location, Access & Surroundings**: Nearest airport & bus terminal with distances; Key points of interest (beaches, landmarks, dining, healthcare) with distance/travel time; Access routes, trails, and recurring local events/festivals.
       - **Module 10: Media, Photos & Sales Copywriting (Airbnb/Booking Spec)**: Official website & Instagram; Google Drive photo repository folders (General master folder, Room category folders, Common areas); Sales copy (Short summary, Full institutional description, The Space, Guest Access, Neighborhood/Surroundings, Getting Around, Important Information, 5 Competitive Highlights, Target Audiences).
     - **Operational Features**:
       - Intelligent field status: empty mandatory fields are automatically counted as `Pendente`. Manual status toggle: `Pendente`, `A confirmar`, `Não se aplica` (does not block progress), `OK / Validado`.
       - Per-field internal team notes (private to Rateway).
       - **"Copiar Pendências para WhatsApp"**: One-click action compiling all pending/to-confirm fields into a polite, formatted WhatsApp message.
       - Stage completion percentage tracking and status chips.
  4. **Cadastros Module (Channel Distribution Matrix & Priority Queue)**:
     - General Matrix view: Hotels (rows) $\times$ Sales Channels (columns) showing non-chromatic state indicators (Uncontracted, To register, In progress, Done by Channel Manager, Live) with single-click modal status updates.
     - Priorities Queue view: Pending onboarding clients sorted by deadline urgency, remaining days, bottleneck alerts ("Aguardando documento", "Aguardando canal", "Em produção interna"), and critical priority dots.
     - Integration of the Cadastros status block inside the Client Overview panel.
  5. **Client Overview & Home Dashboard Integration**:
     - Client Overview: Replace placeholder with active demands filtered for that client in realtime, plus the channel deployment summary.
     - Home Dashboard (`HomeTab`): Team announcement broadcast board with expiration and per-user "Ciente" acknowledgment, "My Demands" quick widget (max 5 rows), and Onboarding KPI metrics.
  6. **Comprehensive GitHub & RMS Handoff Documentation**:
     - Create `docs/RMS_INTEGRATION_GUIDE.md`: SSO / JWT cross-authentication architecture (D-57), session sharing, embedding options (iframe vs. micro-frontend vs. direct repo incorporation).
     - Create `docs/DATABASE_SCHEMA.md`: Complete data dictionary of all Prisma models, relationships, field constraints, AES-256-GCM vault security, and sequence generation.
     - Create `docs/ARCHITECTURE_AND_DEPLOYMENT.md`: Next.js App Router structure, Socket.IO realtime engine, environment variables, and migration instructions for the other team.
     - Update root `README.md` to reflect the RMS sub-system role.
- **Explicitly Excluded**:
  - Overhauling or re-engineering the existing user/role management (the existing Better Auth foundation remains intact for standalone development, while production authentication will be delegated to the parent RMS via SSO).
  - External API synchronization with Asaas or Google Cloud APIs (retaining manual operational control as defined in system specs).

---

## 2. Impacted Files

### Files to Remove
- `src/features/demands/drive/drive-picker.tsx` (Decoupled completely)

### Files to Create
- `prisma/migrations/YYYYMMDD_checklist_and_cadastros/migration.sql` (Database migration for checklist & cadastros)
- `src/features/checklist/actions.ts` (Server actions for checklist stages, fields, and progress)
- `src/features/checklist/types.ts` (Types & Zod schemas for all 10 modules)
- `src/features/checklist/checklist-panel.tsx` (Main interactive tab replacing ComingSoon)
- `src/features/checklist/components/field-wrapper.tsx` (Status dot, pending indicator, internal note popover)
- `src/features/checklist/components/whatsapp-export-button.tsx` (One-click pending items generator)
- `src/features/checklist/modules/mod-01-identification.tsx`
- `src/features/checklist/modules/mod-02-contacts.tsx`
- `src/features/checklist/modules/mod-03-channels.tsx`
- `src/features/checklist/modules/mod-04-structure-operations.tsx`
- `src/features/checklist/modules/mod-05-accommodations.tsx`
- `src/features/checklist/modules/mod-06-amenities-matrix.tsx`
- `src/features/checklist/modules/mod-07-policies.tsx`
- `src/features/checklist/modules/mod-08-payments-bank.tsx`
- `src/features/checklist/modules/mod-09-location-surroundings.tsx`
- `src/features/checklist/modules/mod-10-media-copywriting.tsx`
- `src/features/cadastros/actions.ts` (Server actions for matrix states and priority queue)
- `src/features/cadastros/types.ts` (Cadastros data types)
- `src/features/cadastros/topics.ts` (Realtime event topics)
- `src/features/cadastros/cadastros-tab.tsx` (Replacing placeholder in tab-registry)
- `src/features/cadastros/matrix/matrix-view.tsx` (Channel $\times$ Hotel grid with non-chromatic icons)
- `src/features/cadastros/matrix/status-menu.tsx` (Status change anchored popover)
- `src/features/cadastros/priorities/priorities-view.tsx` (Priority queue with bottleneck badges)
- `src/features/dashboard/actions.ts` (Notices board and summary indicators)
- `src/features/dashboard/dashboard-tab.tsx` (Replacing ComingSoon in tab-registry)
- `src/features/dashboard/notice-dialog.tsx` (Admin announcement modal)
- `docs/RMS_INTEGRATION_GUIDE.md` (RMS SSO, JWT, and embedding guide)
- `docs/DATABASE_SCHEMA.md` (Full database dictionary and relationship diagrams)
- `docs/ARCHITECTURE_AND_DEPLOYMENT.md` (Architecture, Socket.IO, and deployment guide)

### Files to Modify
- `prisma/schema.prisma` (Add property specifications, checklist data models, and channel matrix status)
- `.env.example` & `.env.local` (Remove Google Cloud Picker variables)
- `src/features/demands/drawer/demand-drawer.tsx` (Remove DrivePickerButton, enhance manual link attachment)
- `src/features/clients/sheet/client-tab.tsx` (Mount checklist panel)
- `src/features/clients/sheet/overview.tsx` (Mount client demands list & onboarding progress)
- `src/features/shell/tab-registry.tsx` (Wire Cadastros and Home tabs to real components)
- `CLAUDE.md` (Update rules to reflect Google Picker removal and RMS embedding target)
- `README.md` (Overhaul project description for GitHub and RMS integration)

---

## 3. Step-by-Step Strategy

### Step 1 — Decouple Google Picker & Polish Demands Attachments
1. Remove `src/features/demands/drive/drive-picker.tsx`.
2. Update `src/features/demands/drawer/demand-drawer.tsx` to remove the Google Picker button and script loader.
3. Polish the manual attachment flow:
   - Provide an "Adicionar link" input with URL and optional title.
   - Detect Google Drive domains (`drive.google.com`, `docs.google.com`) and display a distinct Drive icon with an external link indicator.
   - On click, open directly in a new browser tab (`target="_blank"`, `rel="noopener noreferrer"`).
4. Remove the unused `NEXT_PUBLIC_GOOGLE_*` variables from `.env.example`.
5. Run unit and E2E tests to verify Demands integrity.

### Step 2 — Database Schema Extension (Prisma)
1. Add models for:
   - `ClientProperty`: Physical property details, tax IDs, address/Maps, operating hours, meal plans, parking/wifi, bank details.
   - `ClientChecklist`: Persists the 10-module structured data and completion tracking.
   - `RoomCategory`: Stores category name, inventory quantity, max occupancy, and bed configurations.
   - `ClientChannelStatus`: Tracks the granular deployment status of each catalog channel for each client (`nao_contratado`, `a_cadastrar`, `em_andamento`, `feito_pelo_channel_manager`, `no_ar`) and bottleneck notes.
   - `InstanceNotice`: Stores administrative broadcasts for the home dashboard with expiration and user acknowledgment records.
2. Generate migration (`npx prisma migrate dev` or deploy) and regenerate Prisma Client (`npx prisma generate`).

### Step 3 — Modular Checklist Implementation (Ficha do Cliente)
1. Build `FieldWrapper` component:
   - Status dot indicator (empty mandatory = `Pendente`, `A confirmar`, `Não se aplica`, `OK`).
   - Popover for status changing and private internal team notes.
2. Build `WhatsAppExportButton`:
   - Inspects all fields in `ClientChecklist` flagged as `Pendente` or `A confirmar`.
   - Generates formatted, polite message text ready for one-click copy to clipboard.
3. Implement Modules 1 through 10 in `src/features/checklist/modules/`:
   - Mod 1: Legal & Corporate Identification
   - Mod 2: Contacts & Tagged Phones
   - Mod 3: Channels & Systems (with secure JSON export)
   - Mod 4: Physical Structure, Location & Operations
   - Mod 5: Accommodations & Inventory (Room categories & Beds)
   - Mod 6: Room Amenities Matrix (3-state)
   - Mod 7: Property Policies
   - Mod 8: Payments, Bank Details & Commercial Alignment
   - Mod 9: Location, Access & Surroundings
   - Mod 10: Media, Photos & Sales Copywriting (Airbnb/Booking Spec)
4. Connect into `ClientTab` replacing the `ComingSoon` placeholder.

### Step 4 — Cadastros Module (Matriz Geral & Fila de Prioridades)
1. Implement `src/features/cadastros/`:
   - **Matriz View**: Interactive table with clients as rows and catalog channels as columns. Implement canonical non-chromatic state visual (Minus, CircleDashed, CircleHalf, CircleArrowRight, CircleCheck) with hover highlighting and anchored status selection popover.
   - **Priorities Queue View**: Order active onboarding projects by deadline, calculating overdue/near-deadline amber/coral badges and bottleneck tags.
   - Toggle switch for "Mostrar finalizados" and search filter.
2. Wire up Cadastros tab in `tab-registry.tsx`.

### Step 5 — Client Overview & Home Dashboard Integration
1. Update `OverviewPanel` in `src/features/clients/sheet/overview.tsx`:
   - Embed real client demands list (reusing Demands rows without redundant client column).
   - Embed real channel onboarding status summary.
2. Implement `HomeTab` in `src/features/dashboard/`:
   - Administrator announcement banner with per-user "Ciente" acknowledgment.
   - "Minhas Demandas" (max 5 rows of user-assigned demands).
   - Onboarding KPI widgets linked directly to filtered views in Cadastros.

### Step 6 — Comprehensive Documentation for GitHub & RMS Handoff
1. Write `docs/RMS_INTEGRATION_GUIDE.md`:
   - Details how the RMS will pass JWT tokens via SSO redirect `/auth/sso?token=...` or embed the dashboard inside an iframe / microfrontend.
   - Explains role mapping between RMS roles and Support System roles.
2. Write `docs/DATABASE_SCHEMA.md`:
   - Exhaustive breakdown of all tables, fields, cryptographic guarantees, and data flows.
3. Write `docs/ARCHITECTURE_AND_DEPLOYMENT.md`:
   - Explains runtime architecture, Socket.IO realtime server requirements, environment variables, and Docker/VPS setup.
4. Overhaul root `README.md` for clear presentation in the private GitHub repository.

---

## 4. Testing & Edge Cases

- **Unit & Regression Testing**:
  - Run all Vitest suites (`npm test`) ensuring all 67+ existing tests continue to pass without regression.
  - Add unit tests for checklist validation schemas (Zod) and Cadastros status transitions.
- **Decoupled Link Attachments**:
  - Verify that pasting valid and malformed URLs handles errors gracefully without script crashes.
  - Verify that Google Drive links open in a secure external tab without triggering any Google API prompts.
- **Checklist Multi-Property & Dynamism**:
  - Verify that changing property type cleanly adapts visible sections without data corruption.
- **Cadastros Concurrency**:
  - Verify that changing a channel status on the Matrix updates the cell, the priority queue, and the client overview in real time via Socket.IO.
- **Clean Git History & Authorship**:
  - Ensure zero AI attribution trailers (`Co-Authored-By`) and all documentation written strictly in English.