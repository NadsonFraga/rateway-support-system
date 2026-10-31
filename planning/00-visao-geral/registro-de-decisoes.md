# Registro de Decisões

Decisões de produto e de design tomadas durante o planejamento. Cada entrada registra o que foi decidido e o motivo. Specs que conflitarem com este registro devem ser corrigidas.

---

## 30/10/2026 — Consolidação das Leis de Design (Ponto 04.0)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-01 | `design-tokens-and-laws.md` é o documento canônico de design. `design-system.md` fica parcialmente substituído. | Os dois arquivos se contradiziam (36–40px × 44px, `#09090b` × `#08080a`, pílulas flutuantes × zero FAB). |
| D-02 | Matriz de status canônica: cinza = Em Andamento, azul = Aguardando Retorno, âmbar = prazo < 24h, coral = Atrasada/Crítica, verde = Concluída (só histórico). | A tabela de tokens tinha azul e cinza trocados em relação ao módulo de Demandas. |
| D-03 | Linhas de tabela fixas em 44px em todos os módulos. | Unificar a Escala Ergonômica. |
| D-04 | Stagger de montagem: 0,035s. | Shell e tokens divergiam (0,035s × 0,04s). |
| D-05 | `--text-muted` ajustado para `#84849a` (dark) e `#646c7e` (light). | Os valores anteriores reprovavam no WCAG 2.2 AA (3,55:1 e 2,9:1; mínimo 4,5:1). |
| D-06 | Wireframes das specs usam nomes de ícones Lucide, nunca emojis. | Evitar que agentes copiem emojis para o código. |

## 30/10/2026 — Identificadores

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-07 | IDs legíveis são gerados pelo sistema (ID Generator), com máscara configurável e namespace separado por tipo de entidade. Ver `identificadores-e-formatos.md`. | Nenhum dado fixo no código (white-label) e nenhuma colisão entre código de cliente e de demanda. |

## 30/10/2026 — Cofre de Credenciais

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-08 | Sem registro de auditoria de cópia ou revelação de senha. | Decisão de produto: operação direta. |
| D-09 | Sem limpeza automática da área de transferência. | Decisão de produto: operação direta. |
| D-10 | *(Substituída por D-37)* Cada valor (usuário, senha, ID da propriedade) tem botão de cópia próprio. Sem Shift+Clique e sem cópia sequencial para o Win+V. | Mecânicas conflitantes entre specs, e o histórico do Windows não captura duas cópias seguidas de forma confiável. |
| D-11 | AES-256-GCM com IV de 12 bytes e `key_version` por registro. | Padrão NIST SP 800-38D e possibilidade de trocar a chave mestra. |

## 30/10/2026 — Financeiro

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-12 | *(Ajustada por D-38)* Asaas fica apenas como dado cadastral (link da cobrança + dia de vencimento). Sem integração via API nesta fase. | Decisão de produto. A integração entra no backlog. |
| D-13 | O botão de cobrança via WhatsApp é mantido. A mensagem cita a data de vencimento e o link; o operador decide quando cobrar. | Sem API, o sistema não sabe se a fatura foi paga; quem confirma é o operador. |

## 30/10/2026 — Serviços e Status (Ponto 04.1)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-14 | O status pertence a cada **serviço contratado**, não ao cliente. | Um cliente pode ter mais de um serviço, cada um com sua própria fase. |
| D-15 | Serviços padrão: **Cadastro/Revisão** e **Consultoria** (pontuais: pagamento único, prazo, entrega, sem fidelidade); **Assessoria** e **Central de Reservas** (contínuos: mensalidade e fidelidade, sem data final). | Modelo comercial real da operação. |
| D-16 | **Assessoria já inclui Cadastro/Revisão.** Cliente com Assessoria não contrata Cadastro separado; o trabalho de cadastro acontece dentro da fase de Implantação da Assessoria. | Regra comercial. |
| D-17 | Fases por tipo de serviço (rascunho): **Cadastro/Revisão:** Checklist → Em Execução → Entrega → Concluído. **Assessoria / Central de Reservas:** Implantação → Em Operação → Pausado → Encerrado. **Consultoria:** fluxo mínimo, Em Andamento → Concluída (formato varia por cliente; não exige controle detalhado). | Fases descritas pelo usuário. |
| D-18 | O cliente tem apenas **Ativo** ou **Inativo**, calculado automaticamente: Ativo se tiver ao menos um serviço em andamento; Inativo quando todos estiverem concluídos ou encerrados. Inativos ficam no histórico. | Evita status manual duplicado e tira da lista do dia a dia quem já foi atendido. |
| D-19 | **Central de Reservas pode ser contratada sozinha**, mas normalmente vem em pacote com a Assessoria. O sistema não bloqueia a contratação avulsa. | Regra comercial: é tecnicamente possível, embora rara. |

## 30/10/2026 — Listagem de Clientes (Ponto 04.1)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-20 | Colunas da linha de cliente: **Logo + Nome do estabelecimento**, **Serviço(s) contratado(s) com a fase atual**, **Channel Manager**, **PMS**, **Cidade/UF** (secundária) e **Quantidade de demandas abertas**. | Informações que o operador usa para decidir rápido onde clicar. |
| D-21 | Channel Manager e PMS são **cadastrados como campos separados**, mesmo quando são do mesmo fornecedor (ex.: Foco nos dois). | Independência dos dados. |
| D-22 | Na listagem, Channel Manager e PMS ficam **juntos em uma única coluna "Sistemas"**, com os ícones lado a lado (um só ícone quando o fornecedor é o mesmo). No **hover**, abre um tooltip com ícone e nome do Channel Manager e do PMS. | Evita várias colunas; a informação completa fica a um passe de mouse. O cadastro continua com os dois campos separados (D-21). |
| D-23 | Filtros da listagem, no padrão de Demandas: **Status do cliente** (Ativo / Inativo; padrão = Ativo), **Serviço** (Assessoria, Central de Reservas, Cadastro/Revisão, Consultoria) e **Busca** por nome ou código do cliente. Agrupar e Classificar continuam nas Opções de Exibição da sidebar. | Filtros definidos pelo usuário. |
| D-24 | Cabeçalho da ficha mostra o **contato principal** do cliente (pessoa com nome e telefone, ou grupo de WhatsApp com nome e link). Sem avatar de responsável. | Contato padrão usado pela equipe em cada cliente. |
| D-25 | **Fases de serviço sem cor** na interface (só texto), inclusive Pausado. | A cor fica reservada para o que pede atenção (prazos de demandas). |
| D-26 | Status do cliente passa a ter três valores calculados: **Ativo** (ao menos um serviço em andamento ou em operação), **Pausado** (nenhum serviço ativo e ao menos um pausado) e **Inativo** (todos concluídos ou cancelados). A lista abre só com **Ativos**; Pausados e Inativos aparecem apenas quando filtrados. Substitui o padrão de D-18 e D-23. | Pausados e cancelados não devem ocupar a tela do dia a dia. |
| D-27 | A fase final dos serviços contínuos passa a se chamar **Cancelado** (antes "Encerrado"). | Termo usado pela operação. |
| D-28 | **Removido o violeta (`#5e6ad2`) dos tokens.** Destaque, seleção e foco passam a ser monocromáticos (branco/grafite translúcido). | Cumprir a lei Anti-Arco-Íris (95% monocromático). |
| D-29 | Visão Geral prioriza **as demandas do cliente** (coluna principal). Sistemas e Implantação ficam na coluna lateral. | A primeira coisa que a equipe quer ver ao abrir um cliente são as demandas dele. |
| D-30 | O bloco **Implantação** só aparece para perfis com permissão; sem permissão, não é renderizado. | Regra de acesso. |
| D-31 | A animação de montagem escalonada roda **só na primeira abertura de cada aba**; ao voltar para uma aba já aberta, o conteúdo aparece pronto. | Evitar animação repetida e cansativa ao alternar entre abas o dia todo. |

## 30/10/2026 — Dados Técnicos (Ponto 04.3)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-32 | Na Fase 1, a sub-aba Dados Técnicos mostra **só os campos essenciais** (identidade, cidade, site, sistemas, contato principal, contato financeiro, aviso). Os dados técnicos completos aparecem como **"Em breve"**. | Construir primeiro a base do sistema; os dados completos virão do projeto de checklist que o usuário já tem. |
| D-33 | A sub-aba **Checklist de Onboarding** fica como **"Em breve"** na Fase 1. Será reformulada a partir do projeto de checklist do usuário, junto com os Dados Técnicos completos. | Construir a base primeiro. |

## 30/10/2026 — Cofre (Ponto 04.5)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-34 | Sem campo de verificação em duas etapas no Cofre. | O código vai sempre para o número da própria empresa, padrão conhecido pela equipe. |
| D-35 | Cofre em **lista de 44px**, não em cards. Senha sempre com 12 pontos fixos. Botões de cópia sempre visíveis. | Clientes com 10+ canais: colunas alinhadas são mais rápidas de varrer; o tamanho da senha não é revelado. |
| D-36 | **Permissões do Cofre:** todos os perfis veem, revelam e copiam; **somente Administrador** adiciona, edita e remove acessos. | Decisão de produto. |
| D-37 | **Cópia clicando no próprio valor** (ID, usuário, senha) + botão **"Copiar e Abrir Extranet"** que copia senha e usuário em sequência (intervalo de ~700ms, senha primeiro) e depois abre a extranet. **Substitui D-10.** | Fluxo real da equipe com `Win+V`. A senha vai primeiro para que o `Ctrl+V` cole o usuário; a guia abre por último porque o navegador só grava no clipboard com a janela do sistema em foco. Requer o histórico da área de transferência do Windows ativado. |

## 30/10/2026 — Contrato & Cobrança (Ponto 04.6)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-38 | Fase 1 da sub-aba Contrato & Cobrança: **só o vencimento** de cada serviço ("Todo dia X" nos contínuos; data única nos pontuais) + botões **Copiar mensagem** e **Cobrar no WhatsApp**. Sem valores, sem link do Asaas (o link muda a cada cobrança e é copiado manualmente do Asaas), sem cálculos de data. | Sem API do Asaas por enquanto; base mínima primeiro. |
| D-39 | Serviços concluídos ou cancelados ficam recolhidos em **"Serviços anteriores"**. | Manter a tela focada nos serviços ativos. |
| D-40 | Contrato & Cobrança: todos veem e usam os botões de cobrança; **somente Administrador** edita vencimentos e serviços. | Mesmo padrão do Cofre (D-36). |

## 30/10/2026 — Cadastros (Ponto 05)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-41 | Fase 1 do módulo Cadastros: **Matriz geral** e **Fila de prioridades**. Linha do tempo (6 macro-fases) e passo a passo por canal ficam para a próxima fase. | Base primeiro; o passo a passo é um checklist e virá do projeto de checklist do usuário. |
| D-42 | Até a linha do tempo chegar, a fase do serviço Cadastro segue as 4 fases de D-17. A lista detalhada de 6 macro-fases será definida junto com a linha do tempo. | Uma única lista de fases ativa por vez. |
| D-43 | Situação do canal **sem cor**: forma do ícone + brilho (Não contratado → A cadastrar → Em andamento / Feito pelo Channel Manager → No ar, do mais apagado ao mais aceso). | Cumprir a lei Anti-Arco-Íris; cor reservada para prazo. |
| D-44 | "Feito pela FOCO" passa a ser **"Feito pelo Channel Manager"**, com o nome do fornecedor no tooltip. | White-label. |
| D-45 | Cliques na Matriz: nome do hotel abre a ficha do cliente; célula abre menu para trocar a situação; cabeçalho do canal filtra hotéis com pendência naquele canal. | Fluxo aprovado pelo usuário. |
| D-46 | Cor só no prazo da Fila: coral = atrasado; âmbar = 3 dias ou menos; neutro = no prazo. Prioridade: Crítica = dot coral, Alta = `ChevronsUp`, Normal = sem ícone. | Consistência com Demandas. |
| D-47 | O prazo de entrega do Cadastro (padrão: início + 30 dias) é editado na Fila de prioridades, por Analista de Implantação e Administrador. | O prazo saiu da sub-aba Contrato & Cobrança (D-38) e passa a morar onde é usado. |

## 30/10/2026 — Dashboard / Início (Ponto 06)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-48 | O mural do Início mostra só **avisos pontuais publicados pelo Administrador** (ex.: reunião do dia), em faixa de destaque monocromática, com expiração ("Visível até", padrão fim do dia) e botão "Ciente" por usuário. **Avisos de cliente ficam só na ficha do cliente.** | Mural é para comunicados gerais e pontuais, não para regras de clientes. |
| D-49 | Sem bloco alternativo para quem não tem permissão de implantação: Minhas Demandas ocupa a largura toda. O "feed de notas da carteira" sai (não existe vínculo de carteira cliente-colaborador). | Por enquanto; pode ser revisto quando houver carteira. |
| D-50 | *(Ajustada por D-71)* "Perto do prazo" é **3 dias ou menos** em todo o sistema (Dashboard e Cadastros). | Consistência com D-46. |
| D-51 | Minhas Demandas no Início: máximo de 5 linhas, mesmo componente de linha de Demandas (com coluna Cliente), etiqueta "Novo" para demandas não vistas. | Limitar carga cognitiva no ponto de entrada do dia. |
| D-52 | Indicadores de Implantação no Início: Em andamento, Atrasados, Vencem em até 3 dias, Aguardando validação do canal; cada um abre a Fila de prioridades já filtrada. | Atalho direto do número para a ação. |

## 30/10/2026 — Configurações e Login (Ponto 07)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-53 | Removido o **seletor de cor de destaque** da instância. A identidade de cada instância fica no nome e nos logos. | Lei Anti-Arco-Íris (D-28). |
| D-54 | **Três perfis de acesso:** Administrador, Analista de Implantação e Operador de Rotina. Sem perfil separado para Central de Reservas. | Decisão do usuário. |
| D-55 | **Login próprio** com e-mail, senha e Google Authenticator (TOTP) na Fase 1. O sistema funciona separado do RMS. | Decisão do usuário. |
| D-56 | Usar uma **solução de autenticação pronta** (arquitetura já existente), não construída do zero. Candidata a avaliar na implementação: Better Auth (suporte nativo a Next.js, PostgreSQL e 2FA por TOTP). | Menos risco e menos código de segurança próprio. |
| D-57 | Integração com o RMS (aproveitar a sessão de lá via token) fica para fase posterior. | Decisão do usuário. |
| D-58 | Configurações ganham seções para itens criados no planejamento: Identificadores (máscara, palavras ignoradas, prefixo de demanda), Catálogo com PMS, Serviços e Mensagens (template de cobrança). Etapas dos Cadastros ficam "Em breve". | Cada configuração decidida precisa de um lugar para ser editada. |
| D-59 | Atalho padrão de nova demanda: `C`. | Padrão do Linear; já estava no mapa de atalhos. |
| D-60 | Nenhum toast flutuante: confirmação de salvar acontece no próprio botão ("Salvo" com check). | Lei Zero Floating. |
| D-61 | *(Ajustada por D-85)* Tela de login com **e-mail e senha no mesmo formulário**, compatível com o Gerenciador de Senhas do Google (atributos `autocomplete` corretos), e "Sair" sempre visível no menu do avatar. | Vários colaboradores usam o mesmo computador e o preenchimento automático do Google. |
| D-62 | **Criação de usuário:** o Administrador cria o membro e o sistema mostra uma **senha temporária** (válida por 48h) para o admin repassar. No primeiro acesso: troca obrigatória de senha + configuração do Google Authenticator. Esquecimento de senha usa o mesmo fluxo. Convite por e-mail fica para quando houver serviço de envio de e-mail. | Não depende de infraestrutura de e-mail na Fase 1; equipe pequena. |

## 30/10/2026 — Demandas, Tempo Real e Edição (Estruturação em Fases)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-63 | **Tempo real é funcionalidade geral do sistema e entra na fundação da Fase 1.** Toda alteração salva chega a todos os conectados em menos de 1 segundo. Tecnologia (serviço pronto ou servidor próprio) escolhida na implementação, conforme a hospedagem. | Evitar conflitos e retrabalho; adicionar depois exigiria refazer todas as telas. |
| D-64 | **Salvar geral explícito:** altera-se o que quiser e clica em Salvar (`Ctrl+S`); **Esc descarta** (com segundo Esc de confirmação se houver alterações). Sem salvamento automático campo a campo. | Controle do usuário: poder desistir das alterações. |
| D-65 | **Trava da demanda inteira:** só uma pessoa edita por vez; os outros veem "X está editando" em modo leitura. Disputa resolvida no banco (o primeiro vence). Liberação automática (2 min sem conexão ou 15 min sem atividade) e "Assumir a edição" para Administrador. | Impedir que duas pessoas alterem a mesma demanda ao mesmo tempo. |
| D-66 | Ações livres mesmo com trava: **comentar** e **confirmar minha parte**. Marcar subtarefa faz parte da edição. A troca de situação na Matriz de Cadastros continua com um clique. | Ações que não conflitam ou que não têm modo de edição. |
| D-67 | Entram na Fase 1 de Demandas: **Kanban, menções com notificação, anexos do Google Drive, aprovação coletiva, histórico de alterações e presença em tempo real.** | Reavaliação de esforço: nenhum é inviável; o tempo real foi para a fundação. |
| D-68 | Google Drive via seletor oficial (Google Picker) como **app interno** do Google Workspace da empresa (domínio próprio). A demanda guarda só o link. | Workspace permite app interno sem aprovação do Google; todos usam o Chrome logado na conta da empresa. |
| D-69 | **Histórico de alterações** existe nas demandas (linha do tempo: "Ana alterou o prazo…"). Não existe auditoria no Cofre (D-08). | Histórico de trabalho, não de segurança. |
| D-70 | O mesmo modelo (modo leitura → Editar → Salvar/Esc, com trava por registro) vale para os demais registros editáveis em modal: ficha do cliente, acessos do Cofre e serviços. | Comportamento único em todo o sistema. |

## 30/10/2026 — Revisão de Consistência (Início da Implementação)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-71 | **Âmbar tem duas réguas.** Em **Demandas** (lista, Kanban, Minhas Demandas do Início, demandas da Visão Geral do cliente), âmbar = prazo **< 24h** (D-02). Em **Cadastros** (Fila de prioridades) e nos **indicadores de Implantação do Início**, âmbar = **3 dias ou menos** (D-46). Ajusta D-50, que dizia "em todo o sistema". | Demandas são tarefas curtas; prazos de cadastro são de semanas. As specs de Demandas, Clientes e Início já descreviam assim. |
| D-72 | Tipografia: **Inter** para todo o texto e **JetBrains Mono** para códigos, senhas, IDs e teclas de atalho. As duas ficam embutidas no sistema (não dependem de fontes instaladas no computador). | Inter é muito legível em 14–15px e tem números alinhados para tabelas; as fontes do Claude e do Linear são exclusivas. |
| D-73 | A sessão expira após **2 horas sem uso**, com **limite máximo de 12 horas** mesmo em uso contínuo. Completa D-61. | Computador compartilhado: se alguém esquecer de clicar em "Sair", a conta não fica aberta para o próximo colega por um turno inteiro. |
| D-74 | Sigla do cliente com **3 a 4 letras** (antes "2 a 4"). Se a sugestão automática tiver menos de 3 letras, o analista completa. | Siglas de 2 letras colidem demais; a regra antiga se contradizia. |
| D-75 | Hospedagem em **VPS própria** (ainda não contratada). **Não usar Vercel nem Cloudflare Pages**, nem para testes. | Essas plataformas não mantêm conexões permanentes, e o tempo real (D-63) e a trava (D-65) dependem delas. |
| D-76 | **Prisma** como ORM e **Better Auth** como autenticação (2FA por TOTP). Se o Better Auth não atender aos requisitos de login (senha temporária com troca obrigatória, 3 perfis, sessão que expira), parar e apresentar alternativa. Escolhe a candidata de D-56. | Prisma descreve as tabelas num arquivo legível e cria o banco com segurança; Better Auth é solução pronta com suporte nativo a Next.js, PostgreSQL e TOTP. |
| D-77 | O **CLAUDE.md** na raiz do projeto é lido em toda conversa com o Claude Code e define como trabalhar com o usuário e as regras inegociáveis. Em caso de conflito, este registro de decisões continua vencendo qualquer outro arquivo, inclusive o CLAUDE.md. | Garantir que todo trabalho siga as mesmas regras, sem depender de lembrar a cada conversa. |
| D-78 | Senha de cada colaborador com **no mínimo 8 caracteres**. | Fácil de digitar e compatível com o Gerenciador de Senhas do Google; o Google Authenticator completa a proteção. |
| D-79 | Drawer lateral (demandas e demais painéis) com **largura fixa de 560px**, ancorado à direita. | Deixa a lista visível ao lado em telas Full HD e ultrawide. |
| D-80 | **Nova paleta.** Escuro em **grafite neutro** (fundo `#1c1c1d`), claro em **cinza com menos luz** (fundo `#e3e3e3`, cartões `#ececec`). Status e vermelho em **tons suaves**, mantendo o significado de cada cor (D-02). Substitui as paletas obsidiana `#08080a` e ardósia `#f7f8fa` (D-01, D-05) e os tons da matriz em `design-tokens-and-laws.md`. Destaque continua monocromático (D-28). | O usuário achou o escuro preto demais, o claro branco demais e as cores de status e o vermelho chamativos demais. Escolhido entre opções comparadas lado a lado; todo texto passa no contraste WCAG AA. |

## 31/10/2026 — Casca e Navegação (Etapa 1.1)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-81 | Atalhos das abas: **Alt+T** nova aba, **Alt+W** fechar, **Alt+.** próxima, **Alt+,** anterior. `Ctrl+K` continua sendo a busca. Substitui Ctrl+T, Ctrl+W, Ctrl+Tab e Ctrl+Shift+Tab da spec de abas. | O Chrome reserva os atalhos com Ctrl para as abas dele (Ctrl+W fecharia a aba do navegador). A equipe usa notebook, sem PageUp/PageDown. |
| D-82 | A sidebar tem uma **lista fixa no topo** com Início, Demandas, Clientes e Cadastros (ícones 18px); abaixo, a árvore de clientes; no rodapé, Configurações (só Administrador). | A spec da casca não dizia por onde abrir os módulos. |
| D-83 | Notificações ficam numa **caixa de entrada** (ícone `Inbox`, não sino). O painel abre preso ao ícone (não é toast): linhas de 44px, ponto de não lida monocromático, "Marcar todas como lidas"; clicar abre a aba certa. | Escolha do usuário. |
| D-84 | O navegador **lembra as abas abertas** e as reabre no F5 ou no dia seguinte. Rascunhos não salvos sobrevivem só à troca de aba, não ao F5 (D-64). | Não perder o contexto de trabalho. |
| D-85 | **Login por usuário.** Cada conta tem e-mail, usuário e senha; a tela de login pede **usuário + senha** e depois o código do Google Authenticator (D-55 continua). Usuário livre, definido pelo Administrador: minúsculas sem acento, números e ponto (ponto só entre letras ou números), de 3 a 30 caracteres; ao entrar, maiúsculas não importam. O e-mail não serve para entrar; fica para o futuro "Esqueci minha senha" (Fase 3). Ajusta D-61 (o resto dela continua). | Mais prático para a equipe entrar só com usuário e senha. |

## 31/10/2026 — Configurações (Etapa 1.2)

| # | Decisão | Motivo |
| :--- | :--- | :--- |
| D-86 | Em Minha Conta, a seção **Atalhos** mostra só a lista (sem edição) nesta fase. O modo de escuta e a troca de atalhos ficam para a Fase 2. | Resolve a contradição entre `configuracoes-design-v2.md` §3.2 e `fases-de-implementacao.md` (Fase 2, item 4). |
| D-87 | **Configurações sem trava.** Cada seção edita direto e salva no cabeçalho. Se outra pessoa salvar a mesma seção enquanto você edita, aparece na hora um aviso na seção com o nome de quem salvou; você decide salvar por cima ou descartar (Esc). Sem alterações pendentes, a seção se atualiza sozinha. | Só administradores editam e conflitos são raros; um passo de "Editar" a mais não compensa. |
| D-88 | Canal, Channel Manager, PMS e serviço interno do catálogo são **arquivados**, não excluídos: saem das listas e dos novos cadastros, mas continuam nos clientes que já os usam, e podem ser reativados. | Não quebrar o histórico do Cofre e da Matriz. |
| D-89 | Logos e fotos de perfil ficam **no próprio banco** (até 512 KB; PNG, SVG, WebP ou JPG), servidos por rota própria que impede SVG de executar código. | Backup único junto com os dados; nada a configurar na VPS. |
