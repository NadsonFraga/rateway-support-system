# Functional Specification: Demandas (Tasks & Work Orders) Module

## 1. Overview & Operational Principles

The **Demandas** module serves as Rateway's internal task coordination hub. It completely replaces fragmented spreadsheets and ad-hoc chat requests with a disciplined, keyboard-first operational workflow designed for hospitality onboarding, channel maintenance, and tariff management.

### Key Architectural Directives:
- **Strict Zero-Emoji Enforcement:** Statuses and priorities never use emojis. Visual indicators are strictly **6px geometric CSS micro-dots** (`rounded-full w-1.5 h-1.5`).
- **High-Clarity Vector SVGs:** Third-party OTAs, channel managers, and internal tools are rendered via crisp SVG logos (16px to 20px) rather than arbitrary text badges.
- **Single-Window Drawer Interaction:** Inspecting a task never causes full-page navigation. A slide-over drawer animates from the right edge with spring physics, allowing keyboard navigation (`↑`/`↓` to switch tasks, `Esc` to close).
- **Direct Entity Traversal:** Clicking an establishment's name inside any task immediately opens that client's dossier in a new session tab.

---

## 2. Views & Historical Segregation

The module header provides instantaneous view switching:
- **Tab Segregation (Active vs. Historical):**
  - `[ Demandas Ativas  24 ]`: Exclusively displays open, in-progress, or blocked tasks. Concluded tasks are completely excluded from this view to avoid noise.
  - `[ Demandas Concluídas  180 ]`: Dedicated archive of completed work orders with execution timestamps and sign-off records.
- **Layout Modes:**
  - `Lista Operacional` (Default): Compact rows (44px height) optimized for fast visual triage.
  - `Quadro Kanban`: Categorized workflow columns (`A Fazer`, `Em Andamento`, `Aguardando Retorno`, `Concluídas`).

---

## 3. Operational List Row Specification (44px Linear-Style)

Each task row maintains an ergonomic height of **44px** with subtle horizontal borders (`border-b border-white/[0.06]`) and entrance physics (staggered mount at `0.035s` intervals):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Dot    Plataforma   Título da Demanda             Cliente           Atribuídos   Prazo │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ (•)    [SVG Logo]   Ajustar paridade tarifária    [Logo] Fasano     [LM] [SC]    Hoje  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Column Anatomy:
1. **Status Micro-Dot (6px CSS Indicator):**
   - **Sky Blue (`bg-sky-400`):** `Aguardando Retorno` (Blocked by hotel management, OTA extranet support, or external team).
   - **Amber (`bg-amber-400`):** `Atenção de Prazo` (Deadline expires in less than 24 hours).
   - **Coral / Rose (`bg-rose-400`):** `Atrasada / Crítica` (Deadline expired or designated urgent priority).
   - **Neutral Zinc (`bg-zinc-400`):** `Em Andamento Normal` (Standard execution, healthy deadline).
   - **Emerald Green (`bg-emerald-400`):** `Concluída` (Visible strictly within the *Demandas Concluídas* archive tab).
2. **Plataforma / Serviço (SVG Pill):**
   - Official SVG monochrome/colored logo of the target platform (Booking.com, Airbnb, Expedia, Decolar, Foco Channel Manager, Rateway RMS, Assessoria Tarifária).
3. **Título da Demanda:**
   - 14px typography, `tracking-[-0.012em]`, font-medium text. Hover displays full tooltip if truncated.
4. **Cliente Vinculado:**
   - Displays establishment micro-logo (16px) + Name (`Hotel Fasano Itaim`).
   - Clicking opens the client profile in a new workspace tab. Entity ID (#HFI-001) is hidden from row noise.
5. **Colaboradores Atribuídos:**
   - Overlapping 24px circular avatars with operator initials or photos.
6. **Prazo:**
   - Text display (`Hoje 18h`, `Amanhã`, `12 Nov`). Amber or rose coloration activates automatically when approaching deadline.

---

## 4. Slide-Over Detail Drawer (Linear / Raycast Ergonomics)

Clicking any task triggers a slide-over panel on the right viewport margin with continuous spring physics (`stiffness: 380, damping: 30, mass: 0.8`):

### 4.1 Functional Zones:
1. **Header Bar:**
   - Monospace identifier (`#DEM-0042`) with instantaneous link copying.
   - Status selector dropdown pill.
   - Close button (`✕`) bound globally to the `Esc` key.
2. **Platform & Client Context:**
   - Quick pills for `Plataforma` and `Cliente` with 1-click navigation.
3. **Rich Text Description & Google Workspace Integration:**
   - Inline formatting without binary server storage.
   - Direct Google Drive file attachment pills (`[Drive Icon] Planilha Tarifária 2026.xlsx`).
   - Mention engine: `@colaborador`, `@hotel`, `@acesso-canal`.
4. **Interactive Checklist with Physics Animation:**
   - Checking a subtask triggers a micro-press spring bounce on the checkbox box.
   - The SVG checkmark draws dynamically via SVG path stroke interpolation (`0.15s`).
   - Completed label receives a soft strikethrough with opacity fading to 50%.
   - The overall progress bar animates fluidly to the updated percentage.
5. **Real-Time Read Receipts (Ciência do Operador):**
   - Automatically timestamps when each assigned operator opened the task (`Visto às HH:MM`).
   - Displays real-time presence (online dot on active operators).
6. **Internal Timeline & Comments:**
   - Chronological communication thread for operators.
7. **Collective Sign-Off Lock (Optional Governance):**
   - Checkbox: `"Exigir confirmação de todos os colaboradores para concluir"`.
   - Primary conclusion button remains blocked until all assignees click `"Confirmar Minha Parte"`. Admin override available for management roles.

---

## 5. Edição, Trava e Tempo Real (decisões D-63 a D-69, 30/10/2026)

### 5.1 Modo leitura e modo edição
- O drawer abre sempre em **modo leitura**. Qualquer pessoa vê tudo.
- **Editar** (botão no cabeçalho do drawer, atalho `E`) adquire a **trava da demanda inteira** para quem clicou.
- Em edição, as alterações ficam só na tela de quem edita até **Salvar** (botão primário monocromático no cabeçalho; `Ctrl+S`). Salvar grava tudo de uma vez e todos veem em tempo real.
- **Esc descarta** e volta ao modo leitura. Se houver alterações, o primeiro Esc mostra no cabeçalho "Esc de novo para descartar" (âmbar, 13px) por 3s; o segundo Esc descarta.
- Não existe salvamento automático campo a campo.

### 5.2 Trava (uma pessoa por vez)
- Quem abre uma demanda travada vê, no cabeçalho do drawer, faixa `--accent-subdued` com avatar 20px + "Ana está editando" e todos os campos em leitura.
- **Disputa:** a trava é gravada no banco em operação atômica; se dois clicarem em Editar ao mesmo tempo, o primeiro vence e o segundo recebe na hora "Ana começou a editar agora".
- **Liberação automática:** a trava cai se a conexão de quem edita sumir por 2 minutos, ou após 15 minutos sem atividade (com aviso a quem edita 1 minuto antes: "Sua edição será encerrada por inatividade").
- **Administrador** pode "Assumir a edição" (as alterações não salvas de quem editava são descartadas e a pessoa é avisada).

### 5.3 Ações livres (sem Editar/Salvar, mesmo com a demanda travada)
- **Comentar** (cada comentário é uma mensagem nova; não conflita).
- **Confirmar minha parte** (aprovação coletiva).
- Marcar subtarefa **faz parte da edição** (exige Editar e Salvar).

### 5.4 Tempo real
- Toda alteração salva (demanda, status, comentário, menção, atribuição) chega a todos os conectados em menos de 1 segundo: listas, drawer, contadores e o sininho de notificações se atualizam sozinhos.
- **Presença:** o drawer mostra quem está com a demanda aberta agora (avatares 20px sobrepostos + "vendo agora").
- **"Visto às":** horário em que cada atribuído abriu a demanda pela primeira vez.

### 5.5 Histórico de alterações
- Cada Salvar gera uma linha na linha do tempo da demanda, junto com os comentários: "Ana alterou o prazo de 10/11 para 12/11 · 14:32". Texto 13px `--text-secondary`, ícone 14px do tipo de mudança, sem cor.

### 5.6 Recursos confirmados para a Fase 1
Quadro Kanban, menções com `@` (com notificação no sininho), anexos do Google Drive pelo seletor oficial do Google (app interno do Google Workspace da empresa; a demanda guarda só o link), aprovação coletiva, histórico de alterações, presença em tempo real.
