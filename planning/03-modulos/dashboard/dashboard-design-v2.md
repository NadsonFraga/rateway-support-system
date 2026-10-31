# Dashboard (Início) — Especificação de Design (v2)

Detalhamento visual e de comportamento da tela Início para a Fase 1. Segue `01-regras-gerais/design-tokens-and-laws.md` (canônico) e as decisões D-48 a D-52 de `00-visao-geral/registro-de-decisoes.md`. Onde conflitar com `dashboard-spec.md` (v1), vale este arquivo.

---

## 1. Estrutura

```
Boa tarde, Nadson                                                                  [Megaphone Publicar aviso]
sexta-feira, 30 de outubro

┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Megaphone]  Reunião geral hoje às 16h na sala principal.                       Ana · 14:02    [Ciente]  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘

Minhas demandas  14                                              │ IMPLANTAÇÃO
──────────────────────────────────────────────────────────────── │ Em andamento                6
•  [ico]  Ajustar paridade tarifária    [logo] Fasano   Hoje 18h │ Atrasados                   1
•  [ico]  Validar fotos   Novo          [logo] Mar Azul Amanhã   │ Vencem em até 3 dias        2
...                                                              │ Aguardando validação canal  3
                                Ver todas as minhas demandas (14) │ Abrir Cadastros [ArrowUpRight]

[CheckCheck] 12 demandas concluídas hoje pela equipe · você participou de 3
```

---

## 2. Cabeçalho
- **Saudação:** "Bom dia / Boa tarde / Boa noite, {primeiro nome}" em 20px semibold, `tracking-[-0.015em]`; data por extenso abaixo em 14px `--text-muted`.
- **Publicar aviso** (somente Administrador): botão fantasma 32px, ícone `Megaphone` 16px + rótulo 13px, alinhado à direita do cabeçalho (nunca flutuante). Abre um modal pequeno: texto do aviso (até 200 caracteres) e "Visível até" (padrão: fim do dia de hoje; editável).

---

## 3. Mural de Avisos (avisos pontuais da administração)

Avisos pontuais publicados pelo Administrador (ex.: reunião, comunicado do dia). **Avisos de cliente não aparecem aqui**: ficam só na faixa do cabeçalho da ficha do cliente.

- **Faixa por aviso:** largura total, altura mínima de 52px, padding 14px 16px, `rounded-xl`, fundo `--accent-subdued`, borda `--border-medium`. Destaque **monocromático** (sem âmbar, porque aviso geral não é alerta de risco).
- **Conteúdo:** ícone `Megaphone` 18px `--text-primary`; texto 15px `--text-primary`; à direita, autor e horário em 13px `--text-muted`.
- **Ciente:** botão fantasma 13px à direita. Recolhe o aviso **para aquele usuário** (a altura fecha com mola e os blocos abaixo sobem suavemente). O aviso continua visível para quem ainda não clicou.
- **Expiração:** o aviso sai do mural sozinho quando passa do "Visível até".
- **Vários avisos:** empilhados, o mais recente em cima, espaçamento de 8px; no máximo 3 visíveis, o restante em "Mais avisos (n)".
- **Sem avisos ativos:** o mural não é renderizado (sem espaço vazio).
- **Entrada:** um aviso novo publicado enquanto a tela está aberta entra pelo topo com a mola `drawer` (deslocamento de 8px + opacidade).

---

## 4. Minhas Demandas (coluna principal)

- **Título:** "Minhas demandas" 16px semibold + contador total 14px `--text-muted` `tabular-nums`.
- **Conteúdo:** só demandas atribuídas ao usuário logado, ordenadas por urgência (Atrasadas/Críticas → Prazo < 24h → Aguardando Retorno → Em Andamento) e prazo. **Máximo de 5 linhas.**
- **Linhas:** o mesmo componente de linha do Módulo de Demandas (44px), **com** a coluna Cliente (aqui há vários clientes).
- **Indicador "Novo":** demanda ainda não vista pelo usuário. Etiqueta "Novo" 12px medium `--text-primary`, borda `--border-medium`, `rounded-md`, ao lado do título. Ao abrir a demanda, a ciência é registrada e a etiqueta some com fade de 150ms.
- **Clique na linha:** abre o drawer lateral da demanda (mola `drawer`), sem sair do Início.
- **Ver todas as minhas demandas (n):** link 14px `--text-secondary` no rodapé do bloco; abre o Módulo de Demandas em nova aba com o filtro "Atribuídas a mim".
- **Vazio:** "Nenhuma demanda atribuída a você" em 14px `--text-secondary`.

---

## 5. Implantação (coluna lateral, com permissão)

- **Visibilidade:** só para perfis com permissão de implantação (Analista de Implantação e Administrador). Sem permissão, o bloco **não é renderizado** e Minhas Demandas ocupa a largura toda (D-49).
- **Layout:** coluna de 340px com `border-l` `--border-subtle`, mesmo padrão da Visão Geral do cliente. Título de seção 12px semibold maiúsculo `tracking-[0.04em]` `--text-muted`.
- **Indicadores** (linhas de 44px, rótulo 14px `--text-secondary` à esquerda, número 20px semibold `tabular-nums` à direita):
  - Em andamento — `--text-primary`.
  - Atrasados — coral quando maior que zero; `--text-muted` quando zero.
  - Vencem em até 3 dias — âmbar quando maior que zero; `--text-muted` quando zero.
  - Aguardando validação do canal — `--text-primary`.
- **Clique em um indicador:** abre o Módulo de Cadastros na visão Prioridades, já filtrado por aquele recorte.
- **Abrir Cadastros:** link 14px com `ArrowUpRight` 16px no fim do bloco.

---

## 6. Resumo do Dia (rodapé)

- Linha única, 13px `--text-secondary`, ícone `CheckCheck` 16px: "{n} demandas concluídas hoje pela equipe · você participou de {m}".
- Separada dos blocos acima por 32px + `border-t` `--border-subtle`. Sem cor.
- Quando a equipe ainda não concluiu nada no dia: "Nenhuma demanda concluída hoje ainda".

---

## 7. Animação
- **Primeira abertura do dia:** cabeçalho, mural, linhas de demandas e indicadores entram com o escalonamento de 0,035s. Os números dos indicadores e do resumo sobem de 0 até o valor com mola.
- **Ao voltar para a aba Início:** nada reanima (D-31). Números que mudarem enquanto a aba estava aberta interpolam até o novo valor, sem remontar o bloco.
