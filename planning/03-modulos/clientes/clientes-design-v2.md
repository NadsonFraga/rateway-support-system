# Módulo de Clientes — Especificação de Design (v2)

Detalhamento visual e de comportamento do Módulo de Clientes, parte por parte. Segue as leis de `01-regras-gerais/design-tokens-and-laws.md` (canônico) e as decisões D-14 a D-23 de `00-visao-geral/registro-de-decisoes.md`.

Status das partes:
- [x] 04.1 — Listagem de Clientes e Cabeçalho da Ficha
- [x] 04.2 — Sub-aba Visão Geral
- [x] 04.3 — Sub-aba Dados Técnicos (Fase 1: só essenciais; completo = Em breve)
- [x] 04.4 — Sub-aba Checklist de Onboarding (Em breve na Fase 1)
- [x] 04.5 — Sub-aba Cofre de Credenciais
- [x] 04.6 — Sub-aba Contrato & Cobrança (Fase 1: só vencimento + cobrança)

---

## 04.1-A — Listagem de Clientes

### Barra de ações (topo da área de trabalho, nunca flutuante)
```
Clientes  42                                   [Search Buscar nome ou código  /]  [ListFilter Filtros]  [Plus Novo Cliente]
[ Status: Ativo  × ]  [ Serviço: Assessoria  × ]                                               Limpar filtros
```
- **Título:** "Clientes" 20px semibold, `tracking-[-0.015em]`, `--text-primary`. Contador ao lado em 14px `--text-muted`, `tabular-nums`, com interpolação de número em mola ao mudar.
- **Busca:** campo de 32px de altura, `rounded-lg`, fundo `--bg-surface`, borda `--border-subtle`; foco com `--border-focus`. Ícone `Search` 16px. Atalho `/` foca o campo (badge do atalho em `--text-muted`). Busca por nome ou código, com e sem `#`.
- **Filtros:** botão `ListFilter` 18px + rótulo; abre popover ancorado com Status do cliente (Ativo / Pausado / Inativo) e Serviço (múltipla escolha). Entrada do popover: opacidade 0→1 e escala 0,97→1, mola `taptic`, origem no botão.
- **Filtros ativos:** chips removíveis abaixo da barra (13px, `rounded-md`, `--bg-surface`, borda `--border-subtle`, `X` 14px). O filtro padrão "Status: Ativo" aparece como chip para ficar visível que a lista está filtrada.
- **Novo Cliente:** único botão primário da tela, **monocromático** (fundo `--text-primary`, texto `--text-inverse`), 32px, `rounded-lg`, ícone `Plus` 16px. Sem azul ou verde corporativo (lei Anti-Arco-Íris).

### Linha da tabela (44px)
```
Estabelecimento                  Serviços                             Sistemas      Cidade/UF         Demandas
[logo] Hotel Fasano Itaim        [Assessoria · Em Operação] [Central]  [ico]         São Paulo, SP          3 •
[logo] Pousada Mar Azul          [Cadastro · Checklist]                [ico][ico]    Paraty, RJ             —
```
| Coluna | Especificação |
| :--- | :--- |
| **Estabelecimento** | Logo 20px `rounded-md` (fallback: monograma de 2 letras em `--bg-surface-active`, 11px semibold) + nome 14px medium `--text-primary`, truncado com tooltip. Código oculto na linha. |
| **Serviços** | Uma pílula por serviço: 13px, `rounded-md`, borda `--border-subtle`, fundo transparente. Texto "Serviço · Fase". **Todas as fases ficam sem cor** (só texto). Pausado, Concluído e Cancelado não aparecem na lista padrão; só surgem quando filtrados, em `--text-muted`. |
| **Sistemas** | Ícones de Channel Manager e PMS 16px lado a lado (um só se for o mesmo fornecedor). Hover (atraso 300ms) abre tooltip `--bg-surface-elevated`, borda `--border-medium`, `rounded-lg`: ícone + nome, com rótulos "Channel Manager" e "PMS" em 12px `--text-muted`. |
| **Cidade/UF** | 13px `--text-secondary`. Coluna secundária: é a primeira a ser ocultada quando a janela fica estreita. |
| **Demandas** | Número 14px `tabular-nums`, alinhado à direita. Zero aparece como "—" em `--text-muted`. Se houver demanda atrasada, dot coral 6px ao lado do número, com tooltip "1 atrasada". |

- **Separação:** `border-b` `--border-subtle`. Sem zebra.
- **Hover:** fundo `--bg-surface-hover`, transição de 120ms.
- **Clique:** abre a ficha em nova aba de trabalho (keep-alive). Se a aba do cliente já estiver aberta, apenas ativa a aba existente.
- **Teclado:** `↑`/`↓` move a seleção (contorno `--border-focus`), `Enter` abre a ficha.
- **Clientes Pausados e Inativos** (visíveis só quando filtrados): nome em `--text-secondary` e logo com 60% de opacidade.

### Animação
- **Montagem escalonada:** linhas entram com opacidade 0→1 e deslocamento vertical de 4px→0, em intervalos de 0,035s.
- **Limite do escalonamento:** só as primeiras 15 linhas animam; as demais aparecem direto, para a lista longa não "demorar" a carregar.
- **Mudança de filtro:** a lista não remonta inteira; linhas que saem somem com opacidade e as que ficam se reposicionam com mola (`layout`).

### Estados
- **Carregando:** 8 linhas-esqueleto de 44px com pulso sutil de opacidade (sem brilho deslizante).
- **Sem clientes cadastrados:** texto central 14px `--text-secondary` + botão "Novo Cliente" no mesmo padrão monocromático.
- **Sem resultado no filtro:** "Nenhum cliente encontrado com esses filtros" + ação "Limpar filtros".

---

## 04.1-B — Cabeçalho da Ficha do Cliente

```
[logo 40px]  Hotel Fasano Itaim  [ExternalLink]                          [MessageCircle] Grupo Fasano Operação  [Settings]
             #HFI-001 [Copy]   [Assessoria · Em Operação]  [Central de Reservas · Em Operação]
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[AlertTriangle] Mínimo de 3 diárias obrigatório em todos os canais para o Réveillon.
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Visão Geral    Dados Técnicos    Checklist    Cofre de Credenciais    Contrato & Cobrança
═══════════
```
- **Bloco de identidade:** padding 20px vertical e 24px horizontal. Logo 40px `rounded-lg` (mesmo fallback de monograma).
- **Nome:** 20px semibold, `tracking-[-0.015em]`. Ícone `ExternalLink` 16px em `--text-muted` abre o site oficial em nova guia do navegador; fica `--text-primary` no hover.
- **Código:** fonte monoespaçada 13px `--text-muted`. Ícone `Copy` 14px aparece no hover; ao copiar, troca por `Check` por 1,2s com mola `taptic`.
- **Serviços:** mesmas pílulas da listagem, na linha do código.
- **Contato principal:** à direita, antes de Configurações. É o contato padrão do cliente, que pode ser **uma pessoa** ou **um grupo de WhatsApp**. Sem avatar.
  - Pessoa: ícone `Phone` 16px + nome 14px `--text-primary` + número 13px monoespaçado `--text-secondary`. Clique no número copia; o ícone abre a conversa no WhatsApp.
  - Grupo: ícone `MessageCircle` 16px + nome do grupo 14px. Clique abre o grupo pelo link de convite (grupo de WhatsApp não tem número de telefone).
  - Sem contato cadastrado: texto "Sem contato principal" em `--text-muted`, que abre o modal de Configurações.
- **Configurações:** botão fantasma 32px, ícone `Settings` 18px; abre o modal de edição do cliente.
- **Faixa de aviso:** só existe quando há aviso ativo. Fundo âmbar com 8% de opacidade, borda esquerda de 2px `bg-amber-400`, ícone `AlertTriangle` 16px âmbar e texto 14px `--text-primary`. Ao ser criado ou removido, o aviso abre ou fecha a altura com mola, sem saltos de layout.
- **Sub-abas:** altura 40px, texto 14px. Inativa em `--text-secondary`, ativa em `--text-primary` medium. Indicador: sublinhado de 2px na cor `--text-primary`, que desliza entre as abas com mola `tabIndicator` (Framer `layoutId`). Atalhos `Alt+1` a `Alt+5`.
- **Fixação:** o cabeçalho e as sub-abas ficam fixos; só o conteúdo da sub-aba rola.
- **Memória:** cada ficha lembra a última sub-aba aberta e a posição de rolagem (keep-alive).
- **Entrada:** ao abrir a ficha, o bloco de identidade, a faixa de aviso e as sub-abas entram em sequência com o escalonamento de 0,035s.

---

## 04.2 — Sub-aba Visão Geral

Primeira tela ao abrir um cliente. A prioridade é ver **as demandas daquele cliente**.

### Layout (duas colunas)
```
┌──────────────────────────────────────────────────────────────┬───────────────────────────────┐
│ Demandas ativas  5                     [Plus Nova Demanda]   │ SISTEMAS                      │
│ ──────────────────────────────────────────────────────────── │ Channel Manager  [ico] Foco   │
│ •  [ico]  Ajustar paridade tarifária     [LM][SC]   Hoje 18h │ PMS              [ico] Foco   │
│ •  [ico]  Revisar fotos da piscina       [LM]       Amanhã   │                               │
│ •  [ico]  Mapear tarifas de Réveillon    [SC]       12 Nov   │ IMPLANTAÇÃO      4 de 7       │
│                                                              │ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬───────────     │
│                                       Ver concluídas (12)    │ [ico] Booking.com  Conectado  │
│                                                              │ [ico] Airbnb       Em análise │
│                                                              │ [ico] Expedia      Pendente   │
│                                                              │ Abrir em Cadastros [ArrowUpRight]│
└──────────────────────────────────────────────────────────────┴───────────────────────────────┘
```
- **Coluna principal (Demandas):** largura flexível, ocupa o espaço restante.
- **Coluna lateral:** 340px fixos, separada por `border-l` `--border-subtle`. Sem cards com sombra: seções separadas por espaçamento de 24px e títulos de seção em 12px semibold maiúsculo, `tracking-[0.04em]`, `--text-muted`.

### Bloco Demandas (coluna principal)
- **Título:** "Demandas ativas" 16px semibold + contador 14px `--text-muted` `tabular-nums`.
- **Nova Demanda:** botão primário monocromático (`--accent-primary`, texto `--text-inverse`), 32px, ícone `Plus` 16px, alinhado ao título. Abre o formulário de demanda com o cliente já preenchido.
- **Linhas:** **o mesmo componente de linha do Módulo de Demandas** (44px, micro-dot de status, ícone da plataforma, título, atribuídos, prazo), **sem a coluna Cliente**, que seria redundante aqui.
- **Ordem:** por urgência — Atrasadas/Críticas, Prazo < 24h, Aguardando Retorno, Em Andamento — e, dentro de cada grupo, pelo prazo mais próximo.
- **Clique na linha:** abre o **drawer lateral de Demandas** (mesma mola `drawer`) por cima da ficha, sem sair da aba do cliente. `↑`/`↓` navega entre as demandas do cliente, `Esc` fecha.
- **Ver concluídas:** link discreto no rodapé do bloco (14px `--text-secondary`, contador entre parênteses). Alterna a lista para as concluídas do cliente, onde aparece o dot verde.
- **Vazio:** "Nenhuma demanda ativa para este cliente" (14px `--text-secondary`) + botão Nova Demanda.

### Bloco Sistemas (coluna lateral)
- Duas linhas fixas, sempre visíveis na ficha (aqui não há agrupamento, mesmo quando o fornecedor é o mesmo):
  - Rótulo 13px `--text-secondary` ("Channel Manager" / "PMS") à esquerda.
  - Ícone 20px + nome 14px `--text-primary` à direita.
- Sem cadastro: "Não informado" em `--text-muted`.

### Bloco Implantação (coluna lateral, com permissão)
- **Visibilidade:** só aparece para perfis com permissão de implantação. Sem permissão, o bloco não é renderizado (nem como espaço vazio ou cadeado).
- **Resumo:** "4 de 7" (14px `tabular-nums`) à direita do título da seção.
- **Barra de progresso:** 2px de altura, trilho `--border-subtle`, preenchimento `--text-primary`, `rounded-full`. Ao abrir, expande da esquerda com a mola `chartBarReveal`.
- **Lista de canais:** linhas de 36px (lista de leitura dentro da coluna lateral, não tabela operacional): logo do canal 16px + nome 14px + situação 13px `--text-secondary` alinhada à direita. **Sem cor**, seguindo D-25.
- **Abrir em Cadastros:** link 14px com ícone `ArrowUpRight` 16px; abre o módulo de Cadastros em nova aba, já filtrado por este cliente.

### Animação
- Ao abrir a ficha pela primeira vez: título de Demandas, linhas, e depois os blocos da coluna lateral entram em sequência (0,035s), com a barra de implantação expandindo por último.

---

## 04.3 — Sub-aba Dados Técnicos (Fase 1: essenciais + "Em breve")

Os dados técnicos completos (dados cadastrais, políticas, descritivos, parâmetros de tarifa) ficam para uma fase posterior, aproveitando o projeto de checklist que o usuário já tem. Na Fase 1, a sub-aba mostra **apenas os dados essenciais para o sistema funcionar**.

### Campos essenciais (Fase 1)
| Grupo | Campos | Usado em |
| :--- | :--- | :--- |
| **Identidade** | Nome fantasia, logo, sigla/código | Listagem, cabeçalho, abas, busca |
| **Localização** | Cidade/UF | Listagem |
| **Site** | URL do site oficial / motor de reservas | Atalho do cabeçalho |
| **Sistemas** | Channel Manager, PMS | Listagem, Visão Geral |
| **Contato principal** | Pessoa (nome + telefone) ou grupo de WhatsApp (nome + link) | Cabeçalho |
| **Contato financeiro** | Nome + WhatsApp | Cobrança via WhatsApp (sub-aba Contrato & Cobrança) |
| **Aviso importante** | Texto livre (opcional) | Faixa de aviso do cabeçalho |

Credenciais de canais não ficam aqui: ficam no Cofre (sub-aba própria). CPF/CNPJ e razão social não são necessários na Fase 1.

### Layout
```
DADOS ESSENCIAIS                                                          [Pencil Editar]
Nome fantasia        Hotel Fasano Itaim                                          [Copy]
Cidade/UF            São Paulo, SP                                               [Copy]
Site oficial         fasano.com.br                                       [ExternalLink]
...

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ [Clock]  Dados técnicos completos — Em breve                                         │
│          Dados cadastrais, políticas, descritivos e parâmetros de tarifa             │
│          chegam em uma próxima fase.                                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘
```
- **Lista de campos:** formato rótulo/valor em linhas de 44px. Rótulo 13px `--text-secondary` em coluna de 200px; valor 14px `--text-primary`. Ícone `Copy` 16px aparece no hover da linha; ao copiar, vira `Check` por 1,2s (mola `taptic`).
- **Editar:** botão fantasma no título do bloco, `Pencil` 18px. Abre o mesmo modal de Configurações do cliente (um único lugar de edição).
- **Bloco "Em breve":** borda tracejada `--border-medium`, `rounded-xl`, padding 20px, fundo transparente. Ícone `Clock` 20px `--text-muted`; título 14px medium `--text-secondary`; descrição 13px `--text-muted`. Sem botão, sem animação própria.
- **Sub-aba:** continua visível com o nome "Dados Técnicos", sem selo de "Em breve" no rótulo, porque os essenciais já funcionam.

---

## 04.4 — Sub-aba Checklist de Onboarding ("Em breve" na Fase 1)

O checklist será reformulado a partir do projeto de checklist que o usuário já tem e entra junto com os Dados Técnicos completos, em fase posterior.

- **Rótulo da sub-aba:** "Checklist" seguido do texto "Em breve" em 12px `--text-muted` (sem pílula colorida). A sub-aba continua clicável, para manter a ordem e os atalhos `Alt+1` a `Alt+5` estáveis.
- **Conteúdo:** apenas o bloco "Em breve" no mesmo padrão da sub-aba Dados Técnicos (borda tracejada, ícone `Clock` 20px, título e descrição: "O checklist de onboarding chega em uma próxima fase.").
- **Fase "Checklist" do serviço Cadastro/Revisão:** continua existindo como fase do serviço (D-17), marcada manualmente; só a lista de tarefas detalhada é que fica para depois.

---

## 04.5 — Sub-aba Cofre de Credenciais

Acessos de todos os canais do cliente (OTAs, metabuscadores, Channel Manager, PMS), vindos do catálogo de canais das Configurações. Regras de segurança em `01-regras-gerais/seguranca-e-cofre.md` (sem auditoria e sem limpeza de clipboard — D-08, D-09). Verificação em duas etapas **não** tem campo: o padrão da operação é o número da própria empresa, conhecido por toda a equipe (D-34).

### Formato: lista de 44px (não cards)
Um cliente pode ter 10 ou mais canais. Em lista, os campos ficam alinhados em colunas e a varredura é mais rápida do que em cards empilhados.

```
Acessos  8                                                  [Search Buscar canal  /]   [Plus Adicionar Acesso]
──────────────────────────────────────────────────────────────────────────────────────────────────────────────
Canal                  ID da Propriedade   Usuário                   Senha
[ico] Booking.com      104928              reservas@hotel.com.br     ••••••••••••  [Eye]   [Copy Copiar e Abrir Extranet]
[ico] Airbnb           —                   reservas@hotel.com.br     ••••••••••••  [Eye]   [Copy Copiar e Abrir Extranet]
[ico] Foco (Channel)   FC-2231             fasano.admin              ••••••••••••  [Eye]   [Copy Copiar e Abrir Extranet]
```

### Colunas
| Coluna | Especificação |
| :--- | :--- |
| **Canal** | Logo 20px + nome 14px medium. Se o canal tiver mais de um acesso (ex.: duas contas), o rótulo do acesso aparece em 13px `--text-muted` após o nome. |
| **ID da Propriedade** | Fonte monoespaçada 14px. **Clique copia.** Ausente: "—" em `--text-muted`. |
| **Usuário** | 14px, truncado com tooltip. **Clique copia.** |
| **Senha** | Sempre **12 pontos fixos**, independentemente do tamanho real (não revela o comprimento). **Clique copia a senha real.** Botão `Eye`/`EyeOff` ao lado revela em fonte monoespaçada 14px (transição cruzada de 150ms); volta a ocultar ao sair da sub-aba. |
| **Ação principal** | Botão **"Copiar e Abrir Extranet"** (fantasma, 32px, ícone `Copy` 16px + rótulo 13px). |

### Cópia por clique no valor
- No hover, a célula ganha fundo `--bg-surface-hover`, `rounded-md`, cursor de mão e um ícone `Copy` 14px `--text-muted` no fim da célula (indica que é clicável).
- Ao clicar: o valor é copiado, o ícone vira `Check` por 1,2s (mola `taptic`) e aparece "Copiado" em 12px `--text-secondary`.

### Botão "Copiar e Abrir Extranet"
Um clique executa, nesta ordem:
1. Copia a **senha**.
2. Aguarda ~700ms (tempo para o histórico do Windows registrar a primeira cópia como item separado).
3. Copia o **usuário**.
4. Abre o painel administrativo (extranet) do canal em nova guia do navegador.

**Por que a senha primeiro:** o último item copiado é o que o `Ctrl+V` cola. Assim, na tela de login o operador cola o **usuário** com `Ctrl+V` (primeiro campo) e pega a **senha** pelo `Win+V` (segundo campo).

**Por que a extranet abre por último:** o navegador só permite gravar na área de transferência enquanto a janela do sistema está em foco. Se a nova guia abrisse antes, a segunda cópia falharia.

- **Feedback:** o botão mostra um estado de progresso curto (ícone `Copy` → `Check`, rótulo "Copiado" por 1,2s) antes de a guia abrir.
- **Requisito no computador:** o histórico da área de transferência do Windows precisa estar ativado (Configurações do Windows › Sistema › Área de transferência › Histórico). Sem ele, só o último item (usuário) fica disponível.
- **Canal sem URL de extranet:** o botão copia as credenciais e não abre guia; o rótulo vira "Copiar Acesso".

### Permissões
- **Todos os perfis** veem, revelam e copiam todos os acessos.
- **Somente Administrador** adiciona, edita e remove acessos. Para os demais perfis, o botão "Adicionar Acesso" e o menu de edição não são renderizados.

### Edição (Administrador)
- **Adicionar Acesso:** botão primário monocromático na barra da sub-aba. Abre modal com: canal (do catálogo, com busca), rótulo opcional, ID da propriedade, usuário, senha e URL da extranet (preenchida automaticamente pelo catálogo e editável).
- **Editar / Remover:** menu de contexto da linha (botão `MoreHorizontal` 16px no hover, ou clique direito). Remover pede confirmação no próprio menu (sem diálogo de navegador).

### Estados
- **Vazio:** "Nenhum acesso cadastrado para este cliente" + botão Adicionar Acesso (somente Administrador).
- **Busca:** filtra por nome do canal enquanto digita; sem resultado, "Nenhum canal encontrado".

---

## 04.6 — Sub-aba Contrato & Cobrança (Fase 1: só vencimento + cobrança)

Na Fase 1 a sub-aba é mínima: **vencimento de cada serviço e a ação de cobrar**. Sem valores, sem link do Asaas, sem cálculos de data. O link de pagamento é gerado no Asaas a cada cobrança, então o operador copia de lá e cola na conversa (D-38). Fidelidade, rescisão e aviso prévio ficam para depois (backlog).

### Layout: um bloco por serviço ativo
```
ASSESSORIA                                     Contínuo · Em Operação
Vencimento        Todo dia 10            [Copy Copiar mensagem]  [MessageCircle Cobrar no WhatsApp]

CENTRAL DE RESERVAS                            Contínuo · Em Operação
Vencimento        Todo dia 10            [Copy Copiar mensagem]  [MessageCircle Cobrar no WhatsApp]

Serviços anteriores (2)  [ChevronDown]
```
- **Cabeçalho do bloco:** nome do serviço em 12px semibold maiúsculo, `tracking-[0.04em]`, `--text-muted`; à direita, tipo e fase em 13px `--text-secondary`, sem cor (D-25). Botão `Pencil` 18px no hover do cabeçalho (edição).
- **Linha de vencimento:** 44px. Rótulo 13px `--text-secondary` (coluna de 200px); valor 14px `--text-primary` `tabular-nums`.
  - Contínuos (Assessoria, Central): "Todo dia X" (apenas o dia registrado; nada é calculado).
  - Pontuais (Cadastro/Revisão, Consultoria): a data única registrada.
- **Separação entre blocos:** 32px + `border-t` `--border-subtle`.
- **Serviços anteriores:** concluídos e cancelados ficam recolhidos no fim; ao expandir, a altura abre com mola e os blocos aparecem em `--text-secondary`, sem botões de cobrança.

### Ações de cobrança (ao lado do vencimento, nunca flutuantes)
- **Copiar mensagem:** botão fantasma 32px, `Copy` 16px + rótulo 13px. Copia o texto de cobrança já preenchido; feedback `Check` + "Copiado" por 1,2s.
- **Cobrar no WhatsApp:** botão fantasma 32px, `MessageCircle` 16px + rótulo 13px. Abre o WhatsApp (Web ou Desktop) na conversa do **contato financeiro** com o mesmo texto. O operador cola o link do Asaas antes de enviar.
- **Template** (editável em Configurações), sem link: termina em "Segue o link para pagamento:" para o operador colar o link. Variáveis: `{{contato_financeiro.nome}}`, `{{cliente.nome}}`, `{{instancia.nome}}`, `{{servico}}`, `{{vencimento}}`. O nome da empresa vem sempre de `{{instancia.nome}}` (white-label).
- **Sem contato financeiro cadastrado:** "Cobrar no WhatsApp" fica desabilitado (opacidade 40%) com tooltip "Cadastre o contato financeiro em Dados Técnicos". "Copiar mensagem" continua disponível.

### Fora da Fase 1 (backlog)
Valores, link do contrato, fidelidade mínima, rescisão com aviso prévio e cálculo de "atender até".
