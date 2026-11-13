# Feature Summary: Color System Fixes, Demand List Parity & Sidebar Client Spacing

## 1. Overview
This feature resolved visual styling and data alignment issues reported in the user feedback:
1. **Demand List vs. Board Parity**: Fixed priority grouping so all open demands (including `priority: "normal"`) are properly displayed in List view rather than being omitted.
2. **Checklist Status Dot Visibility**: Replaced invalid Tailwind classes with vivid canonical hex colors and glow highlights (`#43bdd4` for OK, `#ff5c7f` for Pendente, `#ffe269` for A Confirmar, `#6c6f78` for empty default).
3. **Module Progress Bar Color**: Ensured module progress indicators in the checklist sidebar render in bright cyan (`#43bdd4`) rather than falling back to gray.
4. **Cadastros Header Simplification**: Removed the "Buscar por hotel ou código..." search box from the Cadastros header to match the clean canonical prototype.
5. **Sidebar Client List Parity**: Replaced square initial badges with the clean building icon (`Building2`), increased vertical height/spacing (`h-9`, `gap-2.5`, `px-2.5`), added the yellow active tick indicator on the left, and displayed open demand counts on the right.

---

## 2. Modified Files
- `src/features/demands/list/arrange.ts`: Added inclusive priority matching (`critica`, `alta`, `normal` / `media`) with fallback collector so 100% of open demands appear in the list.
- `src/features/demands/list/demands-tab.tsx`: Supported priority group indicators for `critica`, `alta`, and `normal`/`media`.
- `src/app/globals.css`: Registered `--color-cyan-fact`, `--color-yellow-fact`, `--color-pink-fact`, `--color-fact-coral` in `@theme inline`.
- `src/features/checklist/components/field-wrapper.tsx`: Applied vivid colors and glows to `.stdot` status dots and popover selectors.
- `src/features/checklist/checklist-panel.tsx`: Inlined direct background color styling (`var(--cyan-fact, #43bdd4)`) for sidebar progress bars.
- `src/features/cadastros/cadastros-tab.tsx`: Removed the search input and cleaned up unused imports.
- `src/features/shell/sidebar.tsx`: Restyled client entries to match prototype layout with `Building2` icon, `h-9` spacing, active yellow tick, and demand count badge.

---

## 3. Verification & Test Results
- `npm run typecheck`: Passed with 0 errors.
- `npm test`: All 74 unit tests passed across 11 test suites.
- Code standards: Followed strict boundary control, clean code, no AI attribution in commits.
