# Active Context (SSOT)

## Current Objective
Checklist Ergonomics, Operational Parity & Deep Field Detailing (`Sistema Rateway.html`), Multi-Meal Regimes, Inline Amenity Observations, Guest Access & Housekeeping Policies, and Sidebar Navigation Clean-up.

## Current Phase: Phase 4 (Completed & Verified)
- 100% test pass rate (74/74 unit tests, 0 TypeScript errors, clean `next build` and live dev server).
- Clean Codebase:
  - All legacy dev test routes permanently removed; schema pruned.
  - Sidebar top navigation cleaned: `Configurações` and `Minha Conta` removed from the primary module list in `src/features/shell/tab-registry.tsx`.
  - Sidebar primary nav now contains exclusively: Início, Demandas, Clientes, Cadastros.
- Dashboard KPI cards operational: "Clientes em cadastro", "Canais atrasados", "Demandas abertas" and "Finalizadas na semana".
- Módulo 04:
  - Interactive inline detail/observation inputs on all 28 facility cards when checked, with canonical prototype hints.
  - Multi-select meal regimes (*Só acomodação*, *Café da manhã incluso*, *Café da manhã pago à parte*, *Meia pensão (com almoço)*, *Meia pensão (com jantar)*, *Pensão completa*, *All inclusive*).
  - Operating hours and standalone price fields for active regimes.
- Módulo 06:
  - Matriz de comodidades dos quartos with inline specification inputs on active amenities, plus interactive category checkboxes under "Algumas".
- Módulo 07:
  - Guest access section (entry methods: physical reception, digital locks, lockboxes, mobile apps, RFID).
  - Housekeeping section (cleaning frequency, linen exchange, stay cleaning fee).
- PDF Export:
  - Fully synchronized with new fields, inline notes, access methods, and housekeeping policies.

## Recent Changes
1. `src/features/shell/tab-registry.tsx`: Pruned `MODULES` array back to the canonical 4 items (Início, Demandas, Clientes, Cadastros).
2. `src/features/checklist/types.ts`: Added `regimesAlimentacao`, `metodoAcesso`, `detalhesAcesso`, `limpezaFrequencia`, `trocaEnxoval`, `taxaLimpezaEstadia`, `facilidadesExtras`.
3. `src/features/checklist/modules/mod-04-structure-operations.tsx`: Overhauled facilities grid with inline `det` inputs when checked, and multi-regime meal selection.
4. `src/features/checklist/modules/mod-06-amenities-matrix.tsx`: Added inline specification inputs for active amenities.
5. `src/features/checklist/modules/mod-07-policies.tsx`: Added "Acesso e Entrada do Hóspede" and "Limpeza & Governança (Housekeeping)" sections.
6. `src/features/checklist/export-pdf.ts`: Exporting regimes, detailed amenities, access, and housekeeping.

## Next Steps
1. Immediate user verification in browser (`http://localhost:3000`).
2. Final push sequence when user indicates completion.
