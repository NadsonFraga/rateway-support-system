# Módulo de Cadastros — Especificação de Design (v2)

Detalhamento visual e de comportamento do Módulo de Cadastros para a Fase 1. Segue as leis de `01-regras-gerais/design-tokens-and-laws.md` (canônico) e as decisões D-41 a D-47 de `00-visao-geral/registro-de-decisoes.md`. Onde conflitar com `cadastros-spec.md` (v1), vale este arquivo.

## Escopo da Fase 1
| Parte | Fase 1 |
| :--- | :--- |
| Matriz geral (situação de cada canal) | **Entra** |
| Fila de prioridades | **Entra** |
| Linha do tempo de implantação (6 macro-fases, flyout por canal) | Próxima fase |
| Passo a passo (SOP) por canal no drawer | Próxima fase, junto com o projeto de checklist |

Até a linha do tempo chegar, a fase do serviço segue a lista de 4 fases de D-17 (Checklist → Em Execução → Entrega → Concluído).

---

## 1. Estrutura da Tela

```
Cadastros                         [ Matriz | Prioridades ]          [Search Buscar hotel  /]   Mostrar finalizados [switch]
[CircleDashed] A cadastrar   [CircleHalf] Em andamento   [CircleArrowRight] Feito pelo Channel Manager   [CircleCheck] No ar   [—] Não contratado
```
- **Título:** "Cadastros" 20px semibold, `tracking-[-0.015em]`.
- **Alternador de visões:** controle segmentado de 32px com "Matriz" e "Prioridades". O fundo do item ativo (`--accent-subdued`) desliza entre as opções com a mola `tabIndicator`. A visão escolhida é lembrada por aba (keep-alive).
- **Busca:** mesmo padrão da listagem de Clientes (32px, atalho `/`), filtra por nome ou código do hotel.
- **Mostrar finalizados:** interruptor (switch) 13px `--text-secondary`, desligado por padrão.
- **Legenda:** linha fixa abaixo da barra, ícones 16px + rótulos 13px `--text-secondary`, espaçamento de 20px entre itens. Visível só na visão Matriz.

---

## 2. Linguagem Visual da Situação do Canal (sem cor)

A situação de um canal é comunicada por **forma do ícone + brilho**, nunca por cor. O brilho sobe conforme o canal avança.

| Situação | Ícone 16px (stroke 1.75) | Tom |
| :--- | :--- | :--- |
| Não contratado | traço `Minus` | `--text-muted` com 50% de opacidade |
| A cadastrar | `CircleDashed` | `--text-muted` |
| Em andamento | círculo meio preenchido (SVG próprio, metade esquerda preenchida) | `--text-secondary` |
| Feito pelo Channel Manager | `CircleArrowRight` | `--text-secondary` |
| No ar | `CircleCheck` | `--text-primary` |

- Todo ícone tem `aria-label` e tooltip com o nome da situação (WCAG 1.4.1).
- O rótulo "Feito pelo Channel Manager" é genérico (white-label); o nome do fornecedor aparece no tooltip a partir do cadastro do cliente (ex.: "Feito pelo Channel Manager — Foco").

---

## 3. Visão Matriz

```
Estabelecimento                  Booking  Airbnb  Expedia  Decolar  Google  Trivago  TripAdv.   No ar
[logo] Hotel Fasano Itaim          (✓)     (◐)     (○)      (—)      (→)     (○)      (○)       2/6
       Assessoria
[logo] Pousada Mar Azul            (○)     (○)     (—)      (—)      (○)     (—)      (○)       0/4
       Cadastro / Revisão
```

### Colunas
- **Estabelecimento (fixa à esquerda, 280px):** logo 20px `rounded-md` + nome 14px medium; abaixo, o serviço (Cadastro/Revisão ou Assessoria) em 13px `--text-muted`. Linha de 44px, por isso o serviço fica na mesma linha do nome quando houver espaço e em tooltip quando não houver.
- **Canais (dinâmicos, 64px cada):** vêm do catálogo de canais das Configurações. Cabeçalho com logo do canal 16px + nome 12px `--text-secondary`, centralizados. Célula com o ícone de situação centralizado.
- **No ar (fixa à direita, 72px):** fração "2/6" em 14px `tabular-nums` (canais no ar / canais contratados). Ao mudar, o número interpola com mola.
- **Rolagem horizontal:** só a área dos canais rola; Estabelecimento e No ar ficam fixas.

### Interação
- **Hover na célula:** fundo `--bg-surface-hover` `rounded-md` na célula e destaque sutil (`--bg-surface-hover` com 50% de opacidade) na linha e na coluna inteiras, formando uma cruz que facilita ler hotel × canal.
- **Clique na célula:** abre menu ancorado à célula (sem flutuar sobre a tela inteira) com as 5 situações (ícone + rótulo), a atual marcada com `Check`. Teclado: `↑`/`↓` e `Enter`; `Esc` fecha. Ao escolher, o ícone da célula troca com escala 0,8→1 (mola `taptic`).
- **Clique no nome do hotel:** abre a ficha do cliente em nova aba (keep-alive), como em Demandas.
- **Clique no cabeçalho de um canal:** filtra a matriz para **hotéis com pendência naquele canal** (situação "A cadastrar" ou "Em andamento"). O filtro aparece como etiqueta removível abaixo da barra ("Pendências: Booking.com ×"). Cabeçalho filtrado fica em `--text-primary` com sublinhado de 2px.

### Quem aparece
- **Padrão:** clientes com Cadastro/Revisão que ainda não está Concluído e clientes com Assessoria em fase de Implantação.
- **Mostrar finalizados:** inclui Cadastros concluídos e Assessorias já em operação, com nome em `--text-secondary`.

### Permissões
- Todos os perfis com acesso ao módulo veem a matriz.
- Alterar a situação de um canal: Analista de Implantação e Administrador. Para os demais, a célula não abre menu (só tooltip).

---

## 4. Visão Prioridades (Fila)

Fila de trabalho da equipe de implantação, separada das demandas do dia a dia.

```
     Estabelecimento              Serviço             Progresso        Prazo                      Gargalo
 •   [logo] Pousada Mar Azul      Cadastro / Revisão  0/4  ──────      28/10  Atrasado há 2 dias  Aguardando documento do cliente
 ⌃⌃  [logo] Hotel Fasano Itaim    Assessoria          2/6  ▬▬▬───      02/11  Vence em 3 dias     Em produção interna
     [logo] Resort Vista Verde    Cadastro / Revisão  5/7  ▬▬▬▬▬─      20/11  No prazo            —
```

### Colunas (linhas de 44px)
| Coluna | Especificação |
| :--- | :--- |
| **Prioridade** (24px) | Crítica: micro-dot coral 6px (mesmo de Demandas). Alta: `ChevronsUp` 16px `--text-primary`. Normal: vazio. |
| **Estabelecimento** | Logo 20px + nome 14px medium. |
| **Serviço** | 13px `--text-secondary`. |
| **Progresso** | Fração "2/6" 14px `tabular-nums` + barra de 64×2px (trilho `--border-subtle`, preenchimento `--text-primary`), que expande com a mola `chartBarReveal` na primeira abertura. |
| **Prazo** | Data 14px `tabular-nums` + texto relativo 13px. Atrasado: coral (`text-rose-400` / `text-rose-700` light), "Atrasado há X dias". 3 dias ou menos: âmbar (`text-amber-400` / `text-amber-700`), "Vence em X dias". Demais: `--text-muted`, "No prazo". |
| **Gargalo** | 13px `--text-secondary`: "Aguardando documento do cliente", "Aguardando validação do canal", "Em produção interna" ou "—". |

### Ordem
1. Prazo: atrasados primeiro, depois os que vencem em até 3 dias, depois os demais por data.
2. Dentro do mesmo grupo de prazo: Crítica → Alta → Normal.

### Interação
- **Filtros:** botão `ListFilter` abre popover ancorado com Gargalo e Prioridade; filtros ativos viram etiquetas removíveis.
- **Clique na linha:** abre a ficha do cliente em nova aba.
- **Menu da linha** (`MoreHorizontal` no hover ou clique direito; Analista de Implantação e Administrador): definir prioridade, definir gargalo, editar prazo de entrega (padrão: início do serviço + 30 dias).
- **Mudança de ordem:** quando uma alteração muda a posição de um hotel, a linha se desloca até o novo lugar com mola (`layout`), sem remontar a lista.

### Estados
- **Vazio:** "Nenhuma implantação em andamento".
- **Filtro sem resultado:** "Nenhum hotel com esses filtros" + "Limpar filtros".
- **Carregando:** linhas-esqueleto de 44px com pulso sutil, como em Clientes.

---

## 5. Animação
- Primeira abertura do módulo: barra, legenda e linhas entram com o escalonamento de 0,035s (limite de 15 linhas). Ao voltar para a aba, nada reanima (D-31).
- Troca Matriz ↔ Prioridades: transição cruzada de 150ms entre as visões, sem escalonamento.
