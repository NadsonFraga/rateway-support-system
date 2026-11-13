# Feature Plan: PDF Generation Exact Parity & Full System Data Backup

## 1. Objective & Scope
1. **Checklist PDF Export (Exact Prototype Parity)**:
   - Faithfully replicate `Sistema Rateway.html` (`exportPDF`):
     - Three brand color top stripes: Cyan (`#43bdd4`), Yellow (`#ffe269`), Pink (`#ff5c7f`) at (x: 0, w: W/3), (x: W/3, w: W/3), (x: 2W/3, w: W/3).
     - Rateway header layout with title ("Ficha do estabelecimento"), client name + code, city/state, approval status, and generation date.
     - AutoTable layout per module with `#f4f4f6` headers, 2-column key/value grid, 150pt label column in muted `#64646c`, and body text in `#2d2d32`.
     - Distinct rendering for Accommodations (room categories breakdown: units, m², occupancy, beds, bathroom, description) and Amenities Matrix.
     - Inline tags for uncompleted items: `[PENDENTE]` and `[A CONFIRMAR]`.
     - Page numbering footer on every page: "Rateway · Inteligência em hospedagem · página X de Y".
     - Button in checklist top bar: "PDF" with icon.
     - Download filename: `ficha-[slug-do-cliente].pdf`.

2. **System-Wide & Client-Wide Data Backup**:
   - Provide an option to export 100% of the system data inside **Configurações** (System Settings):
     - Clients & Establishments
     - Checklists (all 11 modules and field statuses)
     - Demands (open, completed, priorities, deadlines, assignees)
     - Vault Credentials (decrypted access links, property IDs, usernames, and passwords for full disaster recovery)
     - System Catalog & Settings
   - Provide modular toggles so the user can export everything (default) or selectively toggle sections.
   - Client-level export (`dados-[slug].json`) with clean 2-space formatting.

*Out of Scope*: Automated cloud backups (S3 / GCS) or automated recurring email dispatches.

---

## 2. Impacted Files
1. `package.json`:
   - Add `jspdf` and `jspdf-autotable` dependencies.
2. `src/features/checklist/export-pdf.ts` (New file):
   - Client-side PDF generation service implementing the exact layout, color stripes, table styles, and module formatters from `Sistema Rateway.html`.
3. `src/features/checklist/checklist-panel.tsx`:
   - Add "PDF" button with icon in the top action bar.
   - Standardize JSON download filename to `dados-${slug(clientName)}.json`.
4. `src/features/settings/actions/backup.ts` (New file):
   - Server action for administrative backup export. Gated to Administrator role, queries full database tree, decrypts vault secrets, and returns structured JSON.
5. `src/features/settings/system/backup-section.tsx` (New file):
   - Settings UI section with modular options (Clientes, Checklists, Demandas, Credenciais, Catálogo) and 1-click full backup download.
6. `src/features/settings/system/settings-tab.tsx`:
   - Add "Backup & Exportação" section entry to the settings frame.

---

## 3. Step-by-Step Strategy
1. **Dependencies**:
   - Install `jspdf` and `jspdf-autotable`.
2. **Exact PDF Generation Service (`export-pdf.ts`)**:
   - Initialize `jsPDF` with A4 portrait, 40pt margins.
   - Render top cyan/yellow/pink bands (3pt height).
   - Render Rateway logo/title block and establishment subtitle.
   - Iterate through modules and format field values, adding `[PENDENTE]` or `[A CONFIRMAR]` markers.
   - Render specialized accommodation cards and amenities matrix.
   - Apply footer with dynamic page numbering across all pages.
   - Save file as `ficha-[nome-do-hotel].pdf`.
3. **Connect Button in Checklist (`checklist-panel.tsx`)**:
   - Add "PDF" action button alongside "JSON" and "WhatsApp".
4. **General System Backup Server Action (`backup.ts`)**:
   - Create `exportFullSystemBackup({ includeVault, includeDemands, includeChecklists, includeClients })`.
   - Query Prisma models with proper includes, decrypt credentials with `decryptSecret`.
   - Format JSON with 2 spaces.
5. **Settings UI Section (`backup-section.tsx`)**:
   - Create clean backup section matching `Sistema Rateway.html` (`vConfig` backup card).
   - Add download trigger with filename `backup-sistema-rateway-YYYY-MM-DD.json`.
6. **Verification**:
   - `npm run typecheck` and `npm test`.

---

## 4. Testing & Edge Cases
- Large checklists with multiple room types break cleanly across pages without overlapping headers.
- UTF-8 characters and accented Portuguese words display without encoding corruption.
- Administrator permission guard prevents unauthorized users from downloading unencrypted vault credentials.
- 0 TypeScript errors and all unit tests passing.
