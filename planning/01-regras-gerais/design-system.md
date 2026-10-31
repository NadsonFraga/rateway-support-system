# Diretrizes de Design System e Ergonomia

> **Parcialmente substituído por `design-tokens-and-laws.md` (canônico).** Os itens abaixo deste arquivo NÃO valem mais:
> - Pílulas de ação flutuantes (seção 1) e `rounded-full` para botões flutuantes (6.1) — proibidos pela lei Zero Floating Action Buttons.
> - Traço de ícones de 1.5px a 2px (seção 2) — padrão é `1.75px`.
> - Seção 4 inteira (linhas de 36–40px, texto de 13px, badges de 11px) — vale a Escala Ergonômica: linhas de 44px, texto de 14–15px.
> - Seção 5 (paleta `#09090b`, azul Fluent `#0078d4`) — valem os tokens de `design-tokens-and-laws.md`.
>
> Continuam válidos: política Zero Emojis, Painéis Redimensionáveis (seção 3), raios (6.1, exceto flutuantes) e a mola de drawer (6.2).

## 1. Identidade Visual e Inspirações

O design do sistema combina a fluidez orgânica do **Wispr Flow**, o minimalismo focado do **Linear / Raycast** e as convenções ergonômicas de janelas do **Windows 11 (Fluent 2)**.

### Referências Estruturais
- **Wispr Flow:** Curvas generosas (*squircular*), microinterações com física de mola (*spring physics*), pílulas de ação flutuantes e ausência de poluição visual.
- **Linear:** Densidade controlada de dados, bordas suaves translúcidas, badges informativos e velocidade orientada a teclado.
- **Windows 11:** Sistema de abas no topo integrado à janela, trilha de navegação (*breadcrumbs*) interativa, painéis com divisor redimensionável e superfícies em camadas com efeito acrílico.

---

## 2. Política Zero Emojis e Padrão Iconográfico

- **Zero Emojis:** É terminantemente proibido o uso de emojis na interface visual, em rótulos de navegação, status ou componentes.
- **Ícones Vetoriais Padronizados:** Toda a sinalização visual utiliza exclusivamente a biblioteca **Lucide Icons** (formato SVG leve, traço consistente de 1.5px a 2px e proporções óticas uniformes).
- **Semântica Visual:** A clareza da interface deve ser transmitida através de tipografia sóbria, cores de status contidas (ex.: badges em tons sutis de verde, âmbar, azul e vermelho) e ícones geométricos funcionais.

---

## 3. Painéis Redimensionáveis (Resizable Panels)

- **Ajuste Ergonômico pelo Usuário:** A barra lateral e os divisores de tela não possuem larguras irreversíveis. A interface implementa o padrão de painéis arrastáveis (utilizando primitivas como `react-resizable-panels`).
- **Comportamento de Arraste:**
  - O usuário pode clicar e arrastar a borda divisória para alargar ou estreitar a barra lateral conforme o tamanho do seu monitor e sua preferência de densidade.
  - A largura definida pelo operador é gravada localmente nas preferências da sessão/conta para ser restaurada no próximo acesso.
  - Limites de segurança (*min-width* de ~180px e *max-width* de ~420px) impedem que a barra seja quebrada ou cubra a área de trabalho.

---

## 4. Regra de Densidade Única Equilibrada

Para manter a consistência visual e eliminar retrabalho de desenvolvimento, o sistema adota uma **Densidade Única Equilibrada**:
- **Altura de Linhas em Tabelas e Listas:** Fixada estritamente entre **36px e 40px**.
- **Espaçamentos Internos (Padding):** Constantes de **8px a 12px** em cards, painéis e formulários.
- **Escala Tipográfica:**
  - Texto operacional padrão: **13px a 14px** com espaçamento entre letras reduzido (`tracking-tight`).
  - Títulos de seção: **16px a 20px** com peso médio ou semi-bold.
  - Badges e metadados secundários: **11px a 12px**.
- **Entrelinha (Line Height):** `leading-relaxed` para permitir leitura rápida e confortável de observações e notas operacionais.

---

## 5. Paleta de Superfícies e Elevação

### 5.1 Dark Mode
- **Fundo Base:** Zinc escuro neutro (`#09090b` / `zinc-950`).
- **Cards e Painéis:** Superfície sutilmente elevada (`#121215` / `zinc-900`) com bordas finas translúcidas (`border border-white/[0.06]`).
- **Elementos Flutuantes Translúcidos:** `backdrop-blur-md bg-zinc-900/75`.
- **Destaques de Seleção:** Cor de destaque da instância configurável (Padrão: Azul Fluent `#0078d4` ou Violeta sutil Linear `#5e6ad2`).

### 5.2 Light Mode
- **Fundo Base:** Slate suave (`#f8fafc` / `slate-50`).
- **Cards e Painéis:** Branco puro (`#ffffff`) com bordas leves (`border-slate-200/80`) e sombra difusa discreta (`shadow-sm`).
- **Elementos Flutuantes Translúcidos:** `backdrop-blur-md bg-white/80`.

---

## 6. Padrões Geométricos e Animações

### 6.1 Cantos Arredondados Contínuos (Squircle)
- **Modais e Cards Externos:** `rounded-2xl` (16px).
- **Inputs, Botões e Cards Internos:** `rounded-xl` (12px) ou `rounded-lg` (8px).
- **Pílulas e Botões Flutuantes:** `rounded-full` (9999px).

### 6.2 Física de Molas (Framer Motion)
Transições puramente lineares de CSS são evitadas. Aberturas de gavetas laterais e expansões utilizam parâmetros elásticos suaves:
```typescript
export const springTransition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mass: 0.8
};
```
