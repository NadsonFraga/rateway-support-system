# Design Laws, Ergonomic Scaling and Motion Specifications

> **Documento canônico.** Em qualquer conflito com `design-system.md`, este arquivo prevalece.

This specification establishes the definitive visual laws, sizing ergonomics, spring physics, and component blueprints for the **Rateway Support System** (Rateway Operations Hub), incorporating feedback from curated benchmark analyses (Linear, Reflect, Campsite, Amie, and Wispr Flow).

---

## 1. Architectural Directives from User Benchmarks

### 1.1 The "Anti-Microscopic" Ergonomic Law (Reflect-Inspired Breathing Room)
A critical flaw of standard modern developer tools (like extreme Linear presets) is rendering text and icons at 10px–12px, creating visual fatigue and a sensation of cluttered data density. Rateway establishes an **Ergonomic Scale**:
- **Navigation & Header Icons:** **18px to 20px** (Lucide / Phosphor stroke `1.75px`). Generous visual clarity.
- **Table & Row Action Icons:** **16px** (never scaled down to 12px–13px).
- **Primary Body & Table Text:** **14px to 15px** with comfortable line-height (`leading-relaxed` / `leading-normal`).
- **Operational Row Height:** Fixed at **44px** (instead of cramped 36px), allowing instant cognitive scanning without squinting.

### 1.2 Zero Floating Action Buttons (Total Dismissal of Floating Pills)
- Floating action buttons (FABs) and floating capsules are **strictly forbidden**.
- All interactive controls are anchored predictably within the layout grid: top titlebars, table action bars, dedicated drawer headers, or keyboard shortcuts (`Ctrl+K` / `C`). No floating overlays obscure underlying data.

### 1.3 Iconographic Clarification (Beyond Linear Icons)
- The user identified Linear's proprietary icons as overly abstract and indistinct.
- **Standard:** Use **Lucide Icons** (or Phosphor) with a uniform `1.75px` stroke and clear metaphorical contours (e.g., distinct folder shapes, sharp checkmarks, unambiguous locks and clock indicators).

### 1.4 Wispr "Staggered Mount" & Chart Unfold Physics
When any view containing metrics, timelines, or progress bars opens, components animate in using spring-based staggered reveals:
- **Number Counters:** Spring counter interpolation from 0 to value.
- **Timeline / Progress Bars:** Horizontal reveal expanding smoothly with a mass-damped spring (`stiffness: 280, damping: 24`).
- **Stagger Children:** Row items appear sequentially with a `0.035s` delay step.
- **Só na primeira abertura (D-31):** ao retornar a uma aba já aberta (keep-alive), nada reanima; o conteúdo aparece pronto.
- **Limite:** em listas, só as primeiras 15 linhas animam.

---

## 2. Color Tokens & Elevation Levels

### 2.1 Dark Mode (Deep Obsidian Canvas)
```css
:root[data-theme="dark"] {
  /* Canvas & Structural Surfaces */
  --bg-app: #08080a;                  /* Deepest Obsidian base */
  --bg-sidebar: #0d0d10;              /* Reflect-style quiet sidebar */
  --bg-surface: #121216;              /* Elevated card / panel */
  --bg-surface-elevated: #18181e;     /* Popovers, menus, modal dialogs */
  --bg-surface-hover: #1e1e26;        /* Subtle interactive hover */
  --bg-surface-active: #262632;       /* Active pressed */

  /* Translucent Borders */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-medium: rgba(255, 255, 255, 0.12);
  --border-strong: rgba(255, 255, 255, 0.20);
  --border-focus: rgba(255, 255, 255, 0.50);   /* 5.3:1 sobre --bg-app (WCAG 2.2 — foco visível ≥ 3:1) */

  /* Typography Hierarchy */
  --text-primary: #f5f5f7;            /* 96% white - High contrast readability */
  --text-secondary: #a0a0ab;          /* Soft cool gray - Descriptions & metadata */
  --text-muted: #84849a;              /* Keyboard badges, hints — 5.48:1 sobre --bg-app (WCAG AA) */
  --text-inverse: #08080a;

  /* Destaque Monocromático (sem cor de marca — lei Anti-Arco-Íris) */
  --accent-primary: #f5f5f7;                   /* Botão primário: fundo claro, texto --text-inverse */
  --accent-hover: #ffffff;
  --accent-subdued: rgba(255, 255, 255, 0.08); /* Seleção ativa (pílula da sidebar, linha selecionada) */
}
```

### 2.2 Light Mode (Clean Executive Slate)
```css
:root[data-theme="light"] {
  /* Canvas & Structural Surfaces */
  --bg-app: #f7f8fa;                  /* Calibrated warm slate canvas */
  --bg-sidebar: #f1f3f6;              /* Distinct subtle sidebar */
  --bg-surface: #ffffff;              /* Pure white elevated cards */
  --bg-surface-elevated: #ffffff;     /* Dropdown menus & popovers */
  --bg-surface-hover: #e9ecf1;        /* Smooth hover */
  --bg-surface-active: #dde1e9;       /* Active pressed */

  /* Subtle Borders */
  --border-subtle: rgba(0, 0, 0, 0.07);
  --border-medium: rgba(0, 0, 0, 0.12);
  --border-strong: rgba(0, 0, 0, 0.18);
  --border-focus: rgba(15, 17, 23, 0.50);      /* 3.5:1 sobre --bg-app (WCAG 2.2 — foco visível ≥ 3:1) */

  /* Typography Hierarchy */
  --text-primary: #0f1117;            /* Deep obsidian ink */
  --text-secondary: #4b5262;          /* Readable graphite slate */
  --text-muted: #646c7e;              /* Inactive hints and icons — 4.74:1 sobre --bg-app (WCAG AA) */
  --text-inverse: #ffffff;

  /* Destaque Monocromático (sem cor de marca — lei Anti-Arco-Íris) */
  --accent-primary: #0f1117;                   /* Botão primário: fundo escuro, texto --text-inverse */
  --accent-hover: #262a33;
  --accent-subdued: rgba(15, 17, 23, 0.06);    /* Seleção ativa */
}
```

### 2.3 Operational Status Matrix (Canônica)
Cores refletem fatos, nunca decoração. Esta tabela é a fonte única para todos os módulos (Demandas, Clientes, Cadastros, Dashboard).

| Estado Semântico | Badge Dark | Badge Light | Micro-Dot 6px |
| :--- | :--- | :--- | :--- |
| **Em Andamento (normal)** | `text-zinc-400 bg-zinc-500/10 border-zinc-500/20` | `text-slate-600 bg-slate-100 border-slate-200/80` | `bg-zinc-400` |
| **Aguardando Retorno** | `text-sky-400 bg-sky-500/10 border-sky-500/20` | `text-sky-700 bg-sky-50 border-sky-200/80` | `bg-sky-400` |
| **Atenção de Prazo (< 24h)** | `text-amber-400 bg-amber-500/10 border-amber-500/20` | `text-amber-700 bg-amber-50 border-amber-200/80` | `bg-amber-400` |
| **Atrasada / Crítica** | `text-rose-400 bg-rose-500/10 border-rose-500/20` | `text-rose-700 bg-rose-50 border-rose-200/80` | `bg-rose-400` |
| **Concluída** (exclusivo do histórico) | `text-emerald-400 bg-emerald-500/10 border-emerald-500/20` | `text-emerald-700 bg-emerald-50 border-emerald-200/80` | `bg-emerald-400` |

**Anatomia do Micro-Dot:** `w-1.5 h-1.5 rounded-full shrink-0` (CSS puro, zero emojis).
**Regra de acessibilidade (WCAG 2.2 — 1.4.1 Uso de Cor):** a cor nunca carrega o significado sozinha. Todo dot tem rótulo textual acessível (`aria-label`) e tooltip no hover com o nome do estado.

--- | :--- | :--- | :--- |
| **On Track / Live** | `text-emerald-400 bg-emerald-500/10 border-emerald-500/20` | `text-emerald-700 bg-emerald-50 border-emerald-200/80` | `bg-emerald-400` |
| **In Progress / Active** | `text-sky-400 bg-sky-500/10 border-sky-500/20` | `text-sky-700 bg-sky-50 border-sky-200/80` | `bg-sky-400` |
| **At Risk / Review** | `text-amber-400 bg-amber-500/10 border-amber-500/20` | `text-amber-700 bg-amber-50 border-amber-200/80` | `bg-amber-400` |
| **Off Track / Blocker** | `text-rose-400 bg-rose-500/10 border-rose-500/20` | `text-rose-700 bg-rose-50 border-rose-200/80` | `bg-rose-400` |
| **Queued / Neutral** | `text-zinc-400 bg-zinc-500/10 border-zinc-500/20` | `text-slate-600 bg-slate-100 border-slate-200/80` | `bg-zinc-400` |

---

## 3. Framer Motion Spring Presets & Stagger Engines

```typescript
export const motionSprings = {
  // 1. Tactile Press (Buttons, checkboxes, microinterations)
  taptic: {
    type: "spring",
    stiffness: 500,
    damping: 32,
    mass: 0.6,
  },

  // 2. Lateral Detail Drawer (Demandas inspection & quick forms)
  drawer: {
    type: "spring",
    stiffness: 380,
    damping: 30,
    mass: 0.8,
  },

  // 3. Tab Indicator & Segmented Controls
  tabIndicator: {
    type: "spring",
    stiffness: 440,
    damping: 32,
    mass: 0.7,
  },

  // 4. Staggered Data Entrance (Wispr Unfold for charts and timelines)
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.035,
        delayChildren: 0.02,
      }
    }
  },

  chartBarReveal: {
    type: "spring",
    stiffness: 280,
    damping: 24,
    mass: 0.85,
  }
};
```

---

## 4. Benchmark Architectural Mapping

### 4.1 Linear Timeline / Roadmap (Image 1) -> Rateway Cadastros Timeline
- **Timeline Structure:** Horizontal time scale partitioned by weeks/months.
- **Stage Bars:** Semi-translucent gradient bars with diamond milestone markers (`◇`).
- **Interaction:** Hovering a phase unfolds sub-tracks by sales channel (Booking.com, Airbnb, Expedia) without shifting the page layout.

### 4.2 Linear Initiatives Tree (Image 2) -> Rateway Channel Connectivity Matrix
- **Tree Hierarchy:** Root client/project node branching with subtle vertical dotted/solid connection lines.
- **Progress Counters:** Clean pill badges (`23 / 102`) coupled with `On track` / `At risk` indicators.
- **Activity Icon:** Smooth trending chevrons (`LucideTrendingUp` / `LucideChevronsUp`) instead of cryptic symbols.

### 4.3 Campsite Feed (Image 3) -> Rateway Dashboard Operational Wall
- **Substituído por D-48:** o mural do Início mostra apenas **avisos pontuais publicados pelo Administrador**, em faixa de destaque monocromática, com autor, horário, botão "Ciente" e expiração. Não há feed agrupado por data. Avisos de cliente ficam só na ficha do cliente. Ver `03-modulos/dashboard/dashboard-design-v2.md`.

### 4.4 Reflect Notes (Image 4) -> Rateway Sidebar & Typography Scale
- **Icon Sizing:** Dedicated 18px–20px navigation icons with adequate whitespace.
- **Seleção:** destaque monocromático translúcido (`--accent-subdued`) nas seleções ativas, sem cor de marca.
- **Contextual Side-Widgets:** Clean calendar widget for scheduling deadlines.

### 4.5 Amie Light Mode (Image 5) -> Rateway Light Mode Architecture
- **Pure White Cards on Warm Slate Canvas:** Crisp white cards against `#f7f8fa` with zero heavy dark drop-shadows.
- **Embedded Action Headers:** Action buttons sit neatly aligned with page headers, not floating randomly over screen content.