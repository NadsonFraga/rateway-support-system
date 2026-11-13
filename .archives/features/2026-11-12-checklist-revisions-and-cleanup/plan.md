# Feature Plan: Checklist Ergonomics, Operational Parity & Deep Field Detailing

## 1. Objective & Scope
Address all operational nuances raised by the user regarding fine-grained OTA distribution, ensuring 100% parity with real-world hospitality requirements and `Sistema Rateway.html`:
1. **Interactive Facility & Amenity Details (`det` fields)**:
   - When any facility in Module 04 is toggled ON, immediately render an inline input field with its canonical hint/placeholder (e.g., Restaurante: "Horário, aberto ao público, refeições servidas"; Lavanderia: "Self-service ou serviço pago, horário"; Piscina: "Externa/coberta, aquecida, horário de uso").
   - In Module 06 (Matriz de Comodidades dos Quartos), render detail inputs for items with hints (e.g., Ar-condicionado: "Só frio ou quente/frio, voltagem"; TV: "Tamanho, smart, canais") whenever the amenity is marked as present.
2. **Flexible Multi-Meal Regimes (Alimentação & Pensões)**:
   - Full support for hotels and pousadas offering multiple simultaneous board types:
     - Multi-select regimes: *Só hospedagem (sem café)*, *Café da manhã incluso*, *Café da manhã pago à parte*, *Meia pensão com almoço*, *Meia pensão com jantar*, *Pensão completa*, *All inclusive*.
     - Granular controls per active meal: Horários de serviço, formato (Buffet, À la carte, etc.), valores avulsos por pessoa.
     - Gastronomy facilities: Restaurante próprio, Bar, Room service, Cozinha de hóspedes.
3. **Property Access & Entry Methods (Acesso do Hóspede)**:
   - Registration of entry method: Recepção 24h, Recepção com horário, Fechadura eletrônica (senha/código), Cofre de chaves (lockbox), Smart lock / Aplicativo, Chave física com anfitrião, Cartão magnético RFID.
   - Instruções de check-in e detalhes de acesso.
4. **Housekeeping & Cleaning Policies (Serviço de Limpeza & Governança)**:
   - Frequência da limpeza durante a estadia: Diária inclusa, A cada X dias, Sob solicitação do hóspede, Somente após o check-out.
   - Troca de enxoval (roupa de cama e toalhas): Frequência e regras.
   - Taxa de limpeza de estadia (valor e aplicabilidade).
5. **Custom / Extra Facilities & Amenities**:
   - Dynamic lists allowing users to register unique extra amenities not in the standard 22 items.

---

## 2. Impacted Files
1. `src/features/checklist/types.ts`:
   - Expand `ChecklistData` with `regimesAlimentacao: string[]`, `metodoAcesso: string[]`, `detalhesAcesso: string`, `limpezaFrequencia: string`, `trocaEnxoval: string`, `taxaLimpezaEstadia: string`, `facilidadesExtras: ExtraServiceItem[]`.
   - Ensure `facilidades` stores `{ on: boolean; det?: string }`.
   - Ensure `comodidades` stores `{ v: string; ids?: string[]; det?: string }`.
2. `src/features/checklist/modules/mod-04-structure-operations.tsx`:
   - Overhaul "Alimentação & Regimes": multi-select badges for regimes, granular details per meal.
   - Render inline text input `det` for each checked facility with prototype placeholder.
   - Add button to add custom extra facilities.
3. `src/features/checklist/modules/mod-06-amenities-matrix.tsx`:
   - Render inline `det` input with placeholder when an amenity with hint is selected.
4. `src/features/checklist/modules/mod-07-policies.tsx`:
   - Add "Acesso & Entrada do Hóspede" section (methods, locks, apps, instructions).
   - Add "Limpeza & Governança" section (cleaning frequency, linen exchange, cleaning fee).
5. `src/features/checklist/export-pdf.ts`:
   - Reflect regimes, meal times, detailed amenities with notes, access methods, and cleaning policies in the generated PDF.

---

## 3. Step-by-Step Strategy
1. **Types (`types.ts`)**: Define strict types and initial state defaults.
2. **Module 04 (`mod-04-structure-operations.tsx`)**:
   - Implement meal regimes multi-selector with independent sub-configurations.
   - Implement conditional inline detail inputs for all 22 facilities with exact canonical hints.
3. **Module 06 (`mod-06-amenities-matrix.tsx`)**:
   - Add inline observation field per amenity row when active.
4. **Module 07 (`mod-07-policies.tsx`)**:
   - Implement guest access methods and housekeeping sections.
5. **PDF Export (`export-pdf.ts`)**:
   - Include new sections and inline details cleanly.
6. **Testing & Validation**:
   - Run `npm run typecheck` and `npm test` to guarantee 0 regressions.

---

## 4. Testing & Verification
- Unit test suite: `npm test` passing with 100% coverage on checklist rules and validations.
- Type check: `npm run typecheck` passing with zero diagnostics.
- Browser test: Validate UI interactions (checking facility opens text input, multiple regimes toggle, access options selectable).
