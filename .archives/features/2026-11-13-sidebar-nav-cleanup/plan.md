# Feature Plan: Sidebar Navigation Clean-up (Remove Unwanted Configurações & Minha Conta from Primary Nav)

## 1. Objective & Scope
Remove unwanted duplicate "Configurações" and "Minha Conta" buttons from the top primary navigation list in the left sidebar:
- **Scope**:
  - In `src/features/shell/tab-registry.tsx`, revert `MODULES` to contain exclusively the 4 canonical system modules:
    1. Início (`Home`)
    2. Demandas (`ClipboardList`)
    3. Clientes (`Building2`)
    4. Cadastros (`Rocket`)
  - "Configurações" will remain strictly in its proper place: at the bottom footer of the sidebar (accessible by administrators).
  - "Minha Conta" will remain strictly in its proper place: inside the user capsule dropdown at the top right of the top-bar and via `Ctrl+K`.
- **Exclusions**:
  - No changes to user permissions or settings routes.

---

## 2. Impacted Files
- `src/features/shell/tab-registry.tsx`: Prune `MODULES` array back to 4 items.

---

## 3. Step-by-Step Strategy
1. Edit `MODULES` in `src/features/shell/tab-registry.tsx` to remove `{ kind: "configuracoes", ... }` and `{ kind: "minha-conta", ... }`.
2. Run `npm run typecheck` and `npm test` to verify complete build and test health.
3. Verify live reload on dev server.

---

## 4. Testing & Edge Cases
- Verify sidebar top nav shows only: Início, Demandas, Clientes, Cadastros.
- Verify sidebar bottom footer retains single Configurações button for Admin.
- Verify top-right user menu still accesses Minha Conta smoothly.
