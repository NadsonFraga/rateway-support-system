# Layout Shell: Antigravity-Style Window Header, Navigation & Resizable Sidebar

## 1. Global Window Architecture

The system operates as a single-window desktop application inspired by the **Antigravity IDE / Raycast** unified window shell:
- **Root Container:** `h-screen w-screen overflow-hidden flex flex-col bg-[var(--bg-app)] select-none`
- **Zero Full-Window Scrolling:** Outer chrome stays anchored; scrolling is isolated to the active tab's workspace.
- **Top Chrome:** Contains workspace context, active path breadcrumb, and top-right personal controls.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [ RATEWAY SUPPORT SYSTEM ] / Clientes / Hotel Fasano Itaim (#HFI-001)    [⌘K] [Bell] [Avatar]│ ◀ 1. Top Window Chrome
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│              │ [ Início ]  [ Hotel Fasano ✕ ]  [ Demanda #DEM-0042 ✕ ]  [+]              │ ◀ 2. Keep-Alive Tab Strip
│              ├─────────────────────────────────────────────────────────────────────────┤
│  SIDEBAR     │                                                                         │
│  (Resizable, │  ACTIVE WORKSPACE VIEWPORT                                              │
│   Reflect    │  (Staggered Mount Entrance Physics: elements animate into view          │
│   Sizing)    │   sequentially with 0.035s spring delays upon tab switch)               │
│              │                                                                         │
└──────────────┴─────────────────────────────────────────────────────────────────────────┘
  ▲ Resizable Border (Draggable split pane with localStorage persistence)
```

---

## 2. Top-Right Personal Controls (Executive Header)

The top-right corner is dedicated strictly to personal operator controls:
- **Global Search:** `[ ⌘K Buscar ]` or `[ Ctrl+K ]` (Lucide `Search` 16px).
- **Caixa de entrada (D-83):** ícone `Inbox` (não sino) com um ponto discreto de não lidas, sem contador chamativo. Abre um painel preso ao ícone.
- **User Profile Capsule:** Minimalist avatar, display name, and active connection status dot (heartbeat / WebSocket live indicator).

---

## 3. Resizable Sidebar & Client Tree Navigation

### 3.1 Display Options Menu (Antigravity Style)
At the header of the Clients section in the sidebar, an options trigger button (`LucideListFilter` / `LucideSlidersHorizontal`) opens a floating context popover with two independent controls:

1. **Agrupar Por (`Group By`):**
   - **Por Serviço:** os serviços do catálogo (D-15: Assessoria, Central de Reservas, Cadastro/Revisão, Consultoria).
   - **Por Status do cliente:** Ativo, Pausado, Inativo (D-26).
   - **Sem Agrupamento:** Lista contínua unificada.
2. **Classificar Por (`Sort By`):**
   - **Últimas Alterações (`Last Updated`):** Mostra primeiro os hotéis com atualizações recentes.
   - **Data de Inclusão (`Date Added`):** Ordem cronológica de entrada.
   - **Ordem Alfabética (`Alphabetical A–Z / Z–A`).**
   - **Volume de Demandas Abertas (`Most Active`):** Prioriza estabelecimentos com mais tarefas pendentes.

### 3.2 Client Item Anatomy
- **Establishment Logo:** Compact square icon (**16px to 18px**, matching the typography line-height) with `rounded-md`. Fallback to a neutral 2-letter monogram if no logo is uploaded.
- **Label:** `13px` medium text, tracking `-0.012em`.
- **Selection State:** Translucent soft pill (`bg-white/[0.08]` in dark mode) identical to the Antigravity active thread pill.

### 3.3 Navegação fixa no topo da sidebar (D-82)
- Início (`Home`), Demandas (`ClipboardList`), Clientes (`Building2`), Cadastros (`Rocket`), ícones 18px. Cada item abre (ou foca) a aba do módulo.

### 3.4 Rodapé da sidebar
- `Configurações` (`Settings` 18px), só para Administrador (configuracoes-design-v2.md). Não existe "Painel Administrativo" separado; Minha Conta fica no menu do avatar.