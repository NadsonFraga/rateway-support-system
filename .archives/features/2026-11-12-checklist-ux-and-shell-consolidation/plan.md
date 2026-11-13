# Feature Plan: Screen Real Estate Reclamation & Prototype Visual Alignment (`Sistema Rateway.html`)

## 1. Objective & Scope

### Objective
Drastically reclaim vertical and horizontal screen real estate across the client workspace and checklist view to eliminate the cramped feeling identified in user testing and comparative screenshots (`media_1794517070998_88a4a938.png` vs `media_1794517081582_ca28e69e.jpg`), bringing the layout to full visual and spatial parity with the canonical prototype (`Sistema Rateway.html`).

### Scope
- **Included**:
  1. **Vertical Space Optimization (~100px recovered before first field)**:
     - **Compact Client Command Bar (`Identity` in `src/features/clients/sheet/client-tab.tsx`)**:
       - Remove bulky 40px square avatar (`EntityLogo`) from the checklist/tab header.
       - Adopt prototype's sleek `cmdBar` layout (`py-2 px-6`):
         - Left: Client title (`text-base font-semibold`) + single-line metadata (`#CVE-001 · Cadastro/Revisão · Em implantação · Desde DD/MM/AAAA`).
         - Right: Quick action buttons (`Solicitar dados`, `Editar cliente` / Configurações, Menu).
       - Reduce vertical height from ~85px to ~40px (saving ~45px).
     - **Slim Sub-Tabs Bar (`SECTIONS` in `client-tab.tsx`)**:
       - Reduce tab bar height from `h-10` to `h-8` (`text-xs`), with accent bottom border matching the prototype's `.pivot` styling.
     - **Lean Checklist Chrome (`#ckchrome` in `src/features/checklist/checklist-panel.tsx`)**:
       - Reduce padding from `py-2.5 px-6` to `py-1.5 px-4`, keeping status tag, live percentage, pending counter, WhatsApp copy, and save status on a single compact line (~34px).
     - **Compact Module Header (`.fhead` in `checklist-panel.tsx`)**:
       - Reduce top margin and font sizes to avoid pushing fields below the fold.

  2. **Horizontal Space Expansion (Eliminate artificial width constraints)**:
     - **Full-Width Form Canvas (`checklist-panel.tsx`)**:
       - Remove `max-w-4xl` (896px constraint) and `mx-auto` that caused massive empty black margins on the right.
       - Use flexible `w-full min-w-0` with `px-6 py-4` so form cards, fields, and accordion panels stretch naturally across the viewport (`1fr`), exactly like in Image 1.
     - **Concise Module Titles (`src/features/checklist/types.ts`)**:
       - Update module titles in `CHECKLIST_MODULES` to match the prototype's short titles (`01 Identificação`, `02 Contatos`, `03 Canais e sistemas`, `04 Instalações e serviços`, `05 Acomodações`, `06 Comodidades dos quartos`, `07 Fotos`, `08 Políticas`, `09 Pagamentos e comissões`, `10 Localização e arredores`, `11 Textos de venda`), eliminating truncation (e.g. `01 Identificação Jurídica &...`) and awkward line wraps.
     - **Refined Sidebar Proportion (`src/features/shell/sidebar.tsx` & `checklist-panel.tsx`)**:
       - Set checklist `.mods` navigation column width to fixed `240px` (prototype standard).
       - Adjust main app sidebar default width to `220px` (down from `260px`), freeing up 40px of screen real estate.

  3. **Preservation of Core Mechanics**:
     - Keep instant reactive progress calculation (`computeFullChecklistProgress`) on keystroke (`useMemo`).
     - Keep 3-column field layout (`.fld`) with interactive status dots (`.stdot`), left accent lines, and private notes.
     - Keep bottom module navigation buttons (`← Anterior` / `Avançar: Próximo →`).

- **Explicitly Excluded**:
  - Modifying backend database schema or API contracts.
  - Changing authentication or authorization logic.

---

## 2. Impacted Files

### Files to Modify
1. `src/features/clients/sheet/client-tab.tsx`:
   - Refactor `Identity` component to compact `cmdBar` format (~40px), remove large avatar, streamline metadata and action buttons.
   - Adjust `SECTIONS` tablist height to sleek `h-8` with prototype indicator.
2. `src/features/checklist/checklist-panel.tsx`:
   - Remove `max-w-4xl` and `mx-auto` from form container; allow full width stretching (`w-full min-w-0`).
   - Slim down top chrome (`#ckchrome`) padding to `py-1.5 px-4`.
   - Compact module header (`.fhead`).
   - Fix `.mods` sidebar column width to 240px with clean single-line module buttons.
3. `src/features/checklist/types.ts`:
   - Update `CHECKLIST_MODULES` titles to concise prototype titles.
4. `src/features/shell/sidebar.tsx`:
   - Set `SIDEBAR_DEFAULT` from `260` to `220` for an airy workspace.

---

## 3. Step-by-Step Strategy

### Step 1 — Compact Client Header & Tabs in `client-tab.tsx`
- Refactor `Identity` to:
  - Header row: `<div className="flex items-center justify-between gap-4 border-b border-line-subtle bg-surface/50 px-6 py-2 shrink-0">`
  - Left: Client title (`<h1 className="text-base font-semibold text-ink">`) + subtitle (`#{client.code} · Cadastro/Revisão · Em implantação`).
  - Right: Action buttons (`Solicitar dados`, `Editar cliente` / Configurações, Menu).
- Compact sub-tabs:
  - `<div role="tablist" className="flex h-8 items-end gap-5 border-b border-line-subtle px-6 bg-surface/30">`
  - Selected tab indicator with accent bottom bar.

### Step 2 — Full-Width Form & Compact Chrome in `checklist-panel.tsx`
- In `#ckchrome`:
  - Change classes to `flex flex-wrap items-center justify-between gap-2 border-b border-line-subtle bg-surface px-6 py-1.5 shrink-0 text-xs`.
- In `.grid`:
  - Set `grid-cols-[240px_minmax(0,1fr)]`.
- In `.form`:
  - Replace `<div className="mx-auto max-w-4xl flex flex-col gap-6">` with `<div className="w-full flex flex-col gap-5 px-6 py-4">`.
  - Tighten `.fhead` spacing (`pb-2` instead of `pb-4`).

### Step 3 — Shorten Module Names in `types.ts`
- Replace verbose titles with:
  - `01`: `Identificação`
  - `02`: `Contatos`
  - `03`: `Canais e sistemas`
  - `04`: `Instalações e serviços`
  - `05`: `Acomodações`
  - `06`: `Comodidades dos quartos`
  - `07`: `Políticas`
  - `08`: `Pagamentos e repasses`
  - `09`: `Localização e arredores`
  - `10`: `Mídia e textos`

### Step 4 — Verification & Tests
- Run `npm run typecheck` to verify zero TypeScript errors.
- Run `npm test` to verify all unit tests pass.
- Inspect rendered UI against user reference images.

---

## 4. Testing & Edge Cases

- **Viewport Responsiveness**:
  - Verify layout expands seamlessly on 1080p, 1440p, and 4K displays without awkward wrapping.
  - Verify fields remain readable and comfortable on smaller laptop displays (1366x768 / 1280x800).
- **Module Navigation**:
  - Verify switching between modules scrolls to top and retains filled form state.
- **Component Tests**:
  - Run all existing unit tests in `tests/unit/checklist.test.ts` and `tests/unit/cadastros.test.ts`.
