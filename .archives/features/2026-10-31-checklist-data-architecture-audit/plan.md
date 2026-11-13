# Feature Plan: Audit, Catalog & Modular Architecture for Client Checklist Data

## 1. Objective & Scope

### Objective
Perform an exhaustive architectural and data audit of the legacy Rateway checklist prototype (extracted from the standalone HTML application and JSON backup). Produce a complete catalog of every collected data point, field type, validation rule, and operational metadata flag. Furthermore, critically evaluate the JSON storage/export format and design a phased, modular architecture to replace the legacy monolithic checklist in the new Rateway Support System.

### Scope
- **Included**:
  - Complete cataloging of all 11 modules from the legacy prototype: `identificacao`, `contatos`, `plataformas`, `instalacoes`, `acomodacoes`, `comodidades` (matrix), `fotos`, `politicas`, `pagamentos`, `localizacao`, and `textos`.
  - Inventory of all UI input types, masks, validations, inline groupings, nested lists, and multi-tier relationships (e.g. bed configurations, room differences, channel markups).
  - Identification of operational workflow mechanisms: field status flags (`pendente`, `a confirmar`, `não se aplica`), internal team-only notes, and demand generation links.
  - In-depth evaluation of the legacy JSON data format (`exportadoEm`, `checklists`, `fichas`, `campos`, `dados`): efficiency, data integrity, normalization vs. denormalization, scalability bottlenecks, and queryability.
  - Architectural blueprint for the next-generation modular & phased checklist: stage-based progression (e.g. Essential Onboarding -> Infrastructure -> Inventory -> Policies -> Marketing Content) and conditional feature activation based on property type and contracted service scope.
  - Persisting the full analysis as dedicated documentation within `.archives/scopes/hotel-onboarding-data-audit-and-modular-architecture.md`.
- **Explicitly Excluded**:
  - Modifying or implementing code in the main application (`src/`, `prisma/`, etc.) during this phase.
  - Implementing the form generation/Google Forms export tool (explicitly declined by the user).
  - Modifying the existing demands or client management modules in the main system.

---

## 2. Impacted Files

### New Documentation Files
- `.archives/features/2026-10-31-checklist-data-architecture-audit/plan.md` (This execution plan)
- `.archives/scopes/hotel-onboarding-data-audit-and-modular-architecture.md` (Comprehensive catalog, schema evaluation, and modular stage-based architecture proposal)

### Source Code Files
- None during this analysis phase (strictly adherence to Phase 2 Hard Stop).

---

## 3. Step-by-Step Strategy

1. **Step 1 — Comprehensive Data Field Extraction & Cataloging**:
   - Parse and extract all field schemas from the legacy HTML code (`MODULES`, `ACOMOD_FIELDS`, `FACILIDADES`, `COMODIDADES`, `DIF_FIELDS`, `BED_TYPES`).
   - Group by module, sub-section, field key, label, data type, mask/validation, visibility conditions (`show`), and audience (`aud: "interno"`).
   - Document field-level state handling (`campos`: `pend`, `conf`, `na`, `n`).

2. **Step 2 — JSON Storage & Export Format Evaluation**:
   - Assess data integrity risks: lack of schema enforcement, string-typed numeric values, loosely coupled relational IDs.
   - Analyze performance and storage efficiency: full document rewriting vs. delta patches, redundancy between `checklists` and `fichas`.
   - Contrast prototype's flat document model with Prisma relational models and PostgreSQL JSONB for flexible sub-entities.

3. **Step 3 — Phased & Modular Architecture Design**:
   - Break down the monolithic 11-module checklist into logical, progressive onboarding stages (Stage 1: Contract & Critical Channels; Stage 2: Basic Operations & Property Specs; Stage 3: Inventory & Amenities; Stage 4: Commercial Policies; Stage 5: Content & Copywriting).
   - Define conditional branching logic (e.g. Hostel dorms, Pet policies, Direct booking payment plans, Multi-unit inheritance).
   - Formulate recommendations for schema modeling in Prisma / PostgreSQL for the future implementation phase.

4. **Step 4 — Review & Verification**:
   - Validate that 100% of the prototype fields and sample JSON data instances (e.g. Maanain 1, Maanain 2, Pousada do Canto) are accounted for.
   - Present the comprehensive research document and summary in Portuguese to the user.

---

## 4. Testing & Edge Cases

- **Data Integrity & Consistency**: Verify how edge cases in legacy data (e.g. unit mismatch warnings where room quantities sum to 16 but totalUnits is 18) are detected and handled.
- **Complex Hierarchical Structures**: Ensure nested bed configurations (A, B, C variants per room) and unit-level differences (`difs`) are cleanly represented without orphan records.
- **Matrix Consistency**: Verify that the 3-state amenity matrix (`todas`, `algumas`, `nenhuma`) maintains referential integrity when room categories are created, renamed, or deleted.
- **Confidentiality & Internal Fields**: Ensure internal-only fields (`Só equipe` / `aud: "interno"` such as FOCO credentials, markups, and commission negotiation status) are isolated from customer-facing inputs.
