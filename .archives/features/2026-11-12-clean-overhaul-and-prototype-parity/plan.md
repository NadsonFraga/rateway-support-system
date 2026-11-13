# Feature Plan: Color System Fixes, Demand List Parity & Sidebar Client Spacing

## 1. Objective & Scope
Address the 5 UX and visual defects identified by the user in the latest feedback:
1. **Demand List View Dropping Items**: Fix `groupDemands` in `arrange.ts` where demands with priority `normal` were excluded when grouped by priority, causing 3 out of 5 demands to disappear in List view while showing in Board view.
2. **Checklist Field Status Dot Visibility**: Ensure `.stdot` status circles in `field-wrapper.tsx` use vivid canonical colors (`#43bdd4` for OK, `#ff5c7f` for Pendente, `#ffe269` for A Confirmar, and a visible `#6c6f78` border for default empty states) instead of invisible or undefined Tailwind tokens.
3. **Checklist Sidebar Progress Bar Color**: Register `--color-cyan-fact: #43bdd4` in `@theme inline` inside `globals.css` and use explicit fallback colors on the 3px `.bar` element so it paints bright cyan instead of remaining gray.
4. **Remove Cadastros Search Input**: Remove the "Buscar por hotel ou código" search input from `cadastros-tab.tsx` as requested, keeping the top bar clean and matching the canonical prototype.
5. **Sidebar Client List Styling**: Restyle client items in `sidebar.tsx` to match `Sistema Rateway.html`: replace chunky 2-letter avatar boxes with a clean building icon, add generous breathing room (`h-9` / `py-2` spacing), active yellow accent tick, and right-aligned demand counter.

*Out of Scope*: Database schema modifications, auth session alterations.

---

## 2. Impacted Files
1. `src/features/demands/list/arrange.ts`:
   - Fix priority grouping logic so all demands (including `normal`, `alta`, and `critica`) are properly grouped and displayed in the list view without omission.
2. `src/app/globals.css`:
   - Declare `--color-cyan-fact: #43bdd4`, `--color-yellow-fact: #ffe269`, and `--color-pink-fact: #ff5c7f` under `@theme inline` so Tailwind utility classes resolve.
3. `src/features/checklist/components/field-wrapper.tsx`:
   - Apply explicit vivid styling to the status dot (`.stdot`) so it is prominently visible on dark surfaces.
4. `src/features/checklist/checklist-panel.tsx`:
   - Ensure progress bar inner fill has direct color styling (`#43bdd4`) preventing gray fallback.
5. `src/features/cadastros/cadastros-tab.tsx`:
   - Remove the search input box from the top header.
6. `src/features/shell/sidebar.tsx`:
   - Update client item styling with clean building icon, slightly expanded vertical spacing, and yellow active indicator.

---

## 3. Step-by-Step Strategy
1. **Demands Grouping Fix (`arrange.ts`)**:
   - Align `groupDemands` for `prioridade` with the system's actual `DEMAND_PRIORITIES` (`["critica", "alta", "normal"]`). Map labels ("Urgente / Crítica", "Alta", "Normal / Média") and guarantee any fallback demand falls into "Normal", ensuring 100% of open demands appear in List view.
2. **Color Tokens & Field Dots (`globals.css` & `field-wrapper.tsx`)**:
   - Register theme tokens in `globals.css`.
   - Update `field-wrapper.tsx` so OK is bright cyan (`#43bdd4`), Pendente is coral (`#ff5c7f`), A Confirmar is yellow (`#ffe269`), and empty is a crisp border (`#6c6f78`).
3. **Sidebar Module Progress Track (`checklist-panel.tsx`)**:
   - Apply `backgroundColor: "var(--cyan-fact, #43bdd4)"` to ensure the 3px progress bar fills in cyan.
4. **Cadastros Clean Header (`cadastros-tab.tsx`)**:
   - Remove search input element from header.
5. **Global Sidebar Client Navigation (`sidebar.tsx`)**:
   - Swap `EntityLogo` with `Building2` icon, increase item height and spacing for better breathing room, and add active state yellow tick.

---

## 4. Testing & Edge Cases
- **Verification of Demands**: Compare List view vs Board view to confirm all 5 open demands are visible in both.
- **Visual Inspection**: Verify field status dots and sidebar progress bars display vivid cyan, yellow, and coral colors.
- **Typecheck & Unit Tests**: Run `npm run typecheck` and `npm test` to ensure 0 errors and 100% test passing.
