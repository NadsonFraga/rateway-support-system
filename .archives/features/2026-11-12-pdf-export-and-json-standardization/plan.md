# Feature Plan: PDF Export Generation & JSON Standardization

## 1. Objective & Scope
Implement the canonical PDF export model matching `Sistema Rateway.html`, verify and standardize the JSON export format, and provide full clarity on the "Enviar para revisão" workflow.

1. **PDF Generation (Ficha Técnica do Estabelecimento)**:
   - Port the exact PDF generation layout from `Sistema Rateway.html` (`exportPDF`):
     - Three-color top accent band (Rateway Cyan `#43bdd4`, Yellow `#ffe269`, Pink `#ff5c7f`).
     - Header with title ("Ficha do estabelecimento"), client name, code, approval/revision status date, and emission timestamp.
     - AutoTable layout per module with clean `#f4f4f6` headers and 2-column key-value rows.
     - Specialized rendering for Accommodations (capacity, room units, beds, bathrooms, amenities) and Amenities Matrix.
     - Visual flags for pending items (`[PENDENTE]`) and unconfirmed items (`[A CONFIRMAR]`).
     - Running footer on every page ("Rateway · Inteligência em hospedagem · página X de Y").
   - Add "PDF" export button to the checklist chrome action bar right alongside "WhatsApp" and "JSON".

2. **JSON Format Verification & Standardization**:
   - Verify existing JSON output structure.
   - Standardize file naming from `checklist-<cuid>.json` to `dados-<nome-do-cliente>.json` (slugified, human-readable).
   - Ensure clean 2-space indentation, consistent UTF-8 characters, and logical key grouping (`exportadoEm`, `cliente`, `checklist`, `acessos`).

3. **Workflow Clarification ("Enviar para revisão")**:
   - Explain to the user the workflow lifecycle: `rascunho` -> `em_revisao` -> `aprovado`.
   - Confirm that "Enviar para revisão" is an internal status transition that marks the draft as ready for supervisor/team audit before final approval, without sending external emails.

*Out of Scope*: Modifying the core database schema or alters to external notification channels.

---

## 2. Impacted Files
1. `package.json`:
   - Add `jspdf` and `jspdf-autotable` dependencies (or client-side dynamic bundle) for deterministic, client-side PDF document generation.
2. `src/features/checklist/export-pdf.ts` (New file):
   - Dedicated client-side service handling page setup, color bars, module table generation, accommodation sub-tables, amenities matrix formatting, and page numbering.
3. `src/features/checklist/checklist-panel.tsx`:
   - Add "PDF" button with icon (`FileText`) next to "JSON".
   - Connect PDF generation trigger to `exportPdf(view, client)`.
   - Improve JSON download filename to human-friendly format `dados-${slug(clientName)}.json`.
4. `src/features/checklist/actions.ts`:
   - Enhance `exportChecklistJson` if needed to ensure clean, standardized key ordering and metadata.

---

## 3. Step-by-Step Strategy
1. **Dependencies**:
   - Install `jspdf` and `jspdf-autotable`.
2. **PDF Generator (`export-pdf.ts`)**:
   - Replicate the exact PDF styling from `Sistema Rateway.html`:
     - Page setup: A4 portrait, margins 40pt.
     - Colored header stripes: Cyan (x: 0, w: W/3, h: 3pt), Yellow (x: W/3, w: W/3, h: 3pt), Pink (x: 2W/3, w: W/3, h: 3pt).
     - Title & Subtitle: "Ficha do estabelecimento", establishment label, approval/revision date.
     - Loop through all 11 modules with `autoTable` tables.
     - Formatter for values: arrays, booleans, nested facilities, accommodations breakdown, amenities matrix.
     - Page count loop adding standard footer.
     - Blob download trigger with filename `ficha-[slug-hotel].pdf`.
3. **UI Integration (`checklist-panel.tsx`)**:
   - Add `<Button variant="ghost" size="sm" onClick={downloadPdf}>` with `FileText` icon in the checklist header bar.
   - Standardize JSON filename to `dados-${slug(client.name || client.code)}.json`.
4. **Verification**:
   - Run `npm run typecheck` and `npm test`.
   - Verify generated PDF layout and downloaded JSON format.

---

## 4. Testing & Edge Cases
- **Empty / Incomplete Checklist**: PDF generates cleanly without crashing when fields are blank.
- **Large Content / Multipage**: AutoTable handles page breaks properly with repeating table headers where needed.
- **Accents & Special Characters (UTF-8)**: Brazilian Portuguese accents (ã, é, ç, etc.) render cleanly in the PDF.
- **Typecheck & Tests**: Verify 0 TypeScript errors and all existing unit tests pass.
