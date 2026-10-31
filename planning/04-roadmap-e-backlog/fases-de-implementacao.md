# Fases de Implementação

Estrutura oficial de construção do sistema, montada a partir das especificações de design v2 e do `00-visao-geral/registro-de-decisoes.md` (D-01 a D-70). Cada etapa só começa quando as etapas de que depende estiverem prontas.

---

## Regra de ordem

Construir primeiro o que os outros módulos usam:
- **Fundação** (banco, login, tokens, componentes, tempo real) → base de tudo.
- **Configurações** (catálogo de canais, PMS, serviços) → alimenta Clientes, Cofre e Cadastros.
- **Clientes** → toda demanda e todo cadastro pertence a um cliente.
- **Demandas** e **Cadastros** → alimentam a Visão Geral do cliente e o Início.
- **Início** por último, porque resume todos os outros.

---

## Fase 1 — Base utilizável

### 1.0 Fundação
| Entrega | Referência |
| :--- | :--- |
| Projeto Next.js (App Router) + Tailwind + componentes Radix/Shadcn + Framer Motion + Zustand | `principios-arquiteturais.md` |
| PostgreSQL + ORM (Prisma ou Drizzle, escolher no início) | `principios-arquiteturais.md` |
| Tokens de cor, tipografia e molas nos dois temas, como variáveis CSS | `design-tokens-and-laws.md` |
| Componentes-base: linha de 44px, micro-dot, botões (primário monocromático, fantasma), campos, menus ancorados, tooltip, drawer, modal, controle segmentado, esqueleto de carregamento, bloco "Em breve" | Specs v2 de todos os módulos |
| Login: e-mail + senha + Google Authenticator, senha temporária (48h) com troca obrigatória, 3 perfis, sessão que expira, compatível com o Gerenciador de Senhas do Google | D-54 a D-56, D-61, D-62 |
| Gerador de IDs por tipo de entidade | `identificadores-e-formatos.md` |
| **Tempo real** (atualização em menos de 1s para todos os conectados) e **serviço de trava de edição** | D-63, D-65 |
| Criptografia do Cofre (AES-256-GCM, IV de 12 bytes, `key_version`) | `seguranca-e-cofre.md` |

**Pronto quando:** é possível entrar com uma conta, ver a tela vazia nos dois temas, e uma alteração de teste feita num navegador aparece em outro em menos de 1 segundo.

### 1.1 Shell e Navegação
- Barra superior com pílula da instância, breadcrumb, busca `Ctrl+K`, sininho de notificações (tempo real) e menu do avatar com "Sair".
- Abas com estado preservado, atalhos padrão (Action Registry) e ponto de "alterações não salvas".
- Sidebar redimensionável com árvore de clientes e Opções de Exibição (Agrupar e Classificar).
- Animação de montagem só na primeira abertura de cada aba (D-31).

**Pronto quando:** dá para abrir, alternar e fechar abas sem perder o que foi digitado, e o sininho recebe uma notificação de teste na hora.

### 1.2 Configurações
- Sistema: Identidade, Identificadores, Catálogo (canais, Channel Managers, PMS, serviços internos), Serviços, Mensagens, Membros. "Etapas dos Cadastros" como "Em breve".
- Minha Conta: Perfil e Aparência (tema).

**Pronto quando:** o administrador cadastra canais e PMS, cria um membro com senha temporária, e esse membro completa o primeiro acesso.

### 1.3 Clientes
- Listagem (filtros Ativo/Pausado/Inativo, serviço, busca; coluna Sistemas com tooltip).
- Ficha: cabeçalho (contato principal, faixa de aviso, sub-abas), Dados Técnicos essenciais, Cofre de Credenciais (incluindo "Copiar e Abrir Extranet"), Contrato & Cobrança (vencimento + WhatsApp), Checklist "Em breve".
- Status do cliente calculado a partir dos serviços (D-26).

**Pronto quando:** um cliente é criado com serviços, aparece na lista certa, e o fluxo "Copiar e Abrir Extranet" funciona com `Ctrl+V` e `Win+V`.

### 1.4 Demandas
- Lista operacional (ativas e concluídas) e quadro Kanban.
- Drawer com modo leitura → Editar → Salvar / Esc, trava da demanda inteira, presença ("vendo agora"), "visto às".
- Vários atribuídos, subtarefas, comentários, menções com `@` (notificação), anexos do Google Drive, aprovação coletiva, histórico de alterações.

**Pronto quando:** duas pessoas abrem a mesma demanda, uma edita e a outra vê "está editando"; ao salvar, a outra vê a mudança e a linha no histórico na hora.

### 1.5 Visão Geral do Cliente
- Bloco de demandas do cliente (mesmo componente de linha, sem coluna Cliente) e bloco Sistemas.

**Pronto quando:** uma demanda criada para o cliente aparece na Visão Geral dele em tempo real.

### 1.6 Cadastros
- Matriz geral (situação por ícone e brilho, cliques aprovados em D-45) e Fila de prioridades (prazo, prioridade, gargalo).
- Bloco Implantação na Visão Geral do cliente.

**Pronto quando:** trocar a situação de um canal na Matriz atualiza o "No ar" da Matriz, a Fila e a Visão Geral do cliente.

### 1.7 Início
- Mural de avisos pontuais (Administrador publica; "Ciente"; expiração), Minhas demandas, Implantação, Resumo do dia.

**Pronto quando:** um aviso publicado aparece para todos na hora e some para quem clica em "Ciente".

### 1.8 Verificação Final da Fase 1
- Contraste WCAG 2.2 AA nos dois temas e navegação completa por teclado.
- Revisão das animações (molas, escalonamento, nada reanimando ao trocar de aba).
- Nenhum nome de empresa, cliente ou canal fixo no código (white-label).
- Zero emojis e zero elementos flutuantes.
- Testes dos fluxos críticos: login, trava de edição, Cofre, tempo real.

---

## Fase 2 — Aprofundamento Operacional

1. **Dados Técnicos completos e Checklist de Onboarding**, a partir do projeto de checklist do usuário, que deve ser organizado antes (D-32, D-33).
2. **Linha do Tempo de Implantação e passo a passo por canal (Cadastros)**, com os templates de etapas em Configurações. A lista oficial de macro-fases deve ser fechada antes (D-41, D-42). Desejo forte do usuário.
3. **Gestão contratual:** valores, link do contrato, fidelidade mínima, rescisão com aviso prévio e cálculo de "atender até" (D-38). A fórmula deve ser validada com exemplos. Regra descrita pelo usuário: fatura vence dia 20; o cliente paga dia 19 e pede o cancelamento no mesmo dia; com aviso prévio de 30 dias, ele paga a próxima fatura e o serviço termina depois dela; "atender até" = um dia antes da fatura seguinte, que ele não pagará mais.
4. **Atalhos personalizáveis por usuário** (modo de escuta em Minha Conta).

---

## Fase 3 — Integrações Externas

1. **Sessão compartilhada com o RMS** (abrir a partir do RMS sem novo login) (D-57).
2. **API do Asaas:** status das cobranças e webhooks (D-12).
3. **Serviço de e-mail:** convite com link e "Esqueci minha senha" (D-62).
4. **Extensão de navegador** para preencher formulários das extranets.
5. **Carteira de clientes por colaborador** (D-49).

---

## Backlog sem fase definida

- **Módulo de Orçamentos e Contratos:** painel comercial completo na barra lateral.
