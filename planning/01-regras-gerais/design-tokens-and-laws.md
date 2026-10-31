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

> **D-80 (31/10/2026):** paleta trocada a pedido do usuário. O escuro obsidiana (`#08080a`) era preto demais e o claro (`#f7f8fa`) claro demais; os status e o vermelho eram chamativos demais. Valores abaixo conferidos por cálculo: todo texto passa de 4,5:1 nos dois temas.

### 2.1 Dark Mode (Grafite neutro)
```css
[data-theme="dark"] {
  --bg-app: #1c1c1d;  --bg-sidebar: #171718;  --bg-surface: #232324;
  --bg-surface-elevated: #2a2a2c;  --bg-surface-hover: #2e2e30;  --bg-surface-active: #363638;

  --border-subtle: rgba(255,255,255,0.07);  --border-medium: rgba(255,255,255,0.12);
  --border-strong: rgba(255,255,255,0.20);  --border-focus: rgba(255,255,255,0.50);

  --text-primary: #e7e7e8;  --text-secondary: #acacb0;  --text-muted: #98989d;  --text-inverse: #1c1c1d;

  /* Destaque monocromático (lei Anti-Arco-Íris) */
  --accent-primary: #e7e7e8;  --accent-hover: #f5f5f6;  --accent-subdued: rgba(255,255,255,0.07);

  /* Cores de fato em tom suave */
  --fact-coral: #d89585;  --fact-amber: #d4b170;
}
```

### 2.2 Light Mode (Cinza com menos luz)
```css
[data-theme="light"] {
  --bg-app: #e3e3e3;  --bg-sidebar: #dcdcdc;  --bg-surface: #ececec;
  --bg-surface-elevated: #f2f2f2;  --bg-surface-hover: #dadada;  --bg-surface-active: #d0d0d0;

  --border-subtle: rgba(0,0,0,0.10);  --border-medium: rgba(0,0,0,0.16);
  --border-strong: rgba(0,0,0,0.26);  --border-focus: rgba(0,0,0,0.55);

  --text-primary: #1a1a1a;  --text-secondary: #454545;  --text-muted: #5c5c5c;  --text-inverse: #ececec;

  --accent-primary: #262626;  --accent-hover: #3a3a3a;  --accent-subdued: rgba(0,0,0,0.06);

  --fact-coral: #864033;  --fact-amber: #6f5317;
}
```

### 2.3 Operational Status Matrix (Canônica, tons suaves — D-80)
Cores refletem fatos, nunca decoração. Esta tabela é a fonte única para todos os módulos (Demandas, Clientes, Cadastros, Dashboard). O significado de cada cor não mudou (D-02); só a intensidade.

| Estado Semântico | Badge escuro (texto / fundo) | Badge claro (texto / fundo) | Micro-dot escuro / claro |
| :--- | :--- | :--- | :--- |
| **Em Andamento (normal)** | `#a6a6aa` / 13% do texto | `#454545` / `#d6d6d6` | `#9a9a9f` / `#7c7c80` |
| **Aguardando Retorno** | `#8fb0cc` / 13% do texto | `#365670` / `#d0d9df` | `#7fa3c3` / `#4f7899` |
| **Atenção de Prazo** (D-71) | `#d4b170` / 13% do texto | `#6f5317` / `#e0d6c0` | `#c9a25b` / `#a57f2e` |
| **Atrasada / Crítica** | `#d89585` / 13% do texto | `#864033` / `#e4d1cb` | `#c98a7a` / `#b0614f` |
| **Concluída** (exclusivo do histórico) | `#93b89b` / 13% do texto | `#3b6044` / `#cfdacf` | `#86ad8f` / `#5d8a68` |

No código, cada valor é uma variável (`--status-*`, `--dot-*`) em `src/styles/tokens.css`.

**Anatomia do Micro-Dot:** `w-1.5 h-1.5 rounded-full shrink-0` com a cor de `--dot-*` (CSS puro, zero emojis).
**Regra de acessibilidade (WCAG 2.2 — 1.4.1 Uso de Cor):** a cor nunca carrega o significado sozinha. Todo dot tem rótulo textual acessível (`aria-label`) e tooltip no hover com o nome do estado.

**Régua do âmbar (D-71):** em Demandas, âmbar = prazo < 24h. Em Cadastros (Fila de prioridades) e nos indicadores de Implantação do Início, âmbar = 3 dias ou menos.

### 2.4 Tipografia (D-72)
- **Texto:** Inter (variável), embutida no sistema. Números de tabelas e prazos com `tabular-nums`.
- **Monoespaçada:** JetBrains Mono para códigos (`#HFI-001`), senhas reveladas, IDs de propriedade e teclas de atalho.

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
- **Cartões um tom acima do fundo (D-80):** cartões `#ececec` sobre fundo `#e3e3e3`, sem sombras pesadas.
- **Embedded Action Headers:** Action buttons sit neatly aligned with page headers, not floating randomly over screen content.