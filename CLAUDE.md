# CLAUDE.md — Rateway Support System

Este arquivo é lido automaticamente pelo Claude Code em toda conversa. Ele define **como trabalhar neste projeto** e **quais regras nunca podem ser quebradas**. Em caso de dúvida, este arquivo e o registro de decisões mandam.

---

## 1. O projeto

Painel desktop (navegador, telas Full HD e ultrawide) para a operação interna de uma empresa de gestão hoteleira: demandas da equipe, ficha de clientes (hotéis), cofre de acessos de canais de venda (Booking, Airbnb, Expedia…), esteira de cadastros e tela de início. Motor **100% white-label**: nenhum nome de empresa, cliente ou canal fixo no código.

### Fontes da verdade (ordem de prioridade)
1. `planning/00-visao-geral/registro-de-decisoes.md` — todas as decisões do registro, com motivo. **Vence qualquer outro arquivo.**
2. Specs de design v2 de cada módulo:
   - `planning/03-modulos/clientes/clientes-design-v2.md`
   - `planning/03-modulos/cadastros/cadastros-design-v2.md`
   - `planning/03-modulos/dashboard/dashboard-design-v2.md`
   - `planning/03-modulos/configuracoes/configuracoes-design-v2.md`
   - `planning/03-modulos/demandas/demandas-spec.md` (inclui a seção 5: edição, trava e tempo real)
3. `planning/01-regras-gerais/design-tokens-and-laws.md` — **canônico** para cores, tamanhos, molas e animações.
4. Demais arquivos de `planning/` (shell, abas, segurança, identificadores, princípios).
5. Specs v1 (`*-spec.md` sem "design-v2") valem só onde a v2 não fala nada.

**Plano de construção:** `planning/04-roadmap-e-backlog/fases-de-implementacao.md` (Fase 1 em etapas 1.0 a 1.8, cada uma com critério de "Pronto quando").

Se duas fontes se contradisserem, **pare e pergunte** ao usuário qual vale. Nunca escolha sozinho.

---

## 2. Como trabalhar com o usuário

O usuário **não é desenvolvedor**. Ele conhece profundamente a operação e o design que quer, mas não termos técnicos (ORM, migração, variável de ambiente etc.).

- **Idioma:** sempre Português do Brasil, direto e simples.
- **Explique antes de fazer:** ao introduzir algo técnico, explique em uma ou duas frases o que é e por que é necessário, sem jargão.
- **Uma etapa por vez.** Nunca avance para a próxima etapa sem o usuário aprovar a atual.
- **Perguntas:** use as perguntas de múltipla escolha do chat (AskUserQuestion) sempre que houver uma decisão, com a opção recomendada em primeiro lugar e o motivo.

### HARD STOP — pare e peça ao usuário
Interrompa o trabalho imediatamente e peça ao usuário, **ensinando passo a passo onde e como obter**, sempre que precisar de:
- qualquer **token, chave de API, senha, credencial** ou acesso (Google Cloud, banco de dados, VPS, GitHub, serviço de tempo real etc.);
- **criar conta** em qualquer serviço, ou qualquer coisa que **gere custo**;
- **instalar programa** no computador dele (ele usa **Windows**);
- uma **decisão de produto ou de design** que não esteja nas fontes da verdade;
- qualquer ação **irreversível** (apagar dados, reescrever histórico do git, publicar).

Regras do HARD STOP:
- Diga exatamente **o que** precisa, **para que** serve e **onde** ele encontra (com o caminho de cliques).
- **Nunca invente** valores, nunca use um valor de exemplo como se fosse real e nunca siga em frente silenciosamente com um "placeholder". Se algo depende do que ele vai fornecer, espere.
- Depois que ele fornecer, confirme que funcionou e só então continue.

### Segredos
- Tokens, senhas e chaves vão **apenas** em `.env.local` (que deve estar no `.gitignore`). Nunca em código, nunca em commit, nunca repetidos no chat depois de recebidos.
- Mantenha um `.env.example` atualizado, só com os **nomes** das variáveis e um comentário explicando cada uma.

---

## 3. Fluxo de cada etapa

1. Ler a etapa em `fases-de-implementacao.md` e todas as specs que ela cita.
2. Entrar em **modo de planejamento** e apresentar o plano em linguagem simples: o que será feito, arquivos principais, o que o usuário vai precisar fornecer (HARD STOPs previstos).
3. Esperar aprovação.
4. Implementar.
5. **Verificar:**
   - o critério "Pronto quando" da etapa;
   - **prints das telas nos dois temas (escuro e claro)** com Playwright, comparando com a spec;
   - as leis da seção 4 (checklist abaixo).
6. Mostrar ao usuário o resultado (prints e como testar no navegador dele) e um resumo curto.
7. Fazer **um commit por etapa**, com mensagem clara em português. **Pedir autorização antes de qualquer push** para o GitHub.

---

## 4. Leis de design inegociáveis

Detalhes em `design-tokens-and-laws.md`. Resumo:

- **Estética:** fusão de Linear + Antigravity IDE + Windows 11. Grafite neutro no escuro (`#1c1c1d`), cinza com menos luz no claro (`#e3e3e3`), status em tons suaves (D-80). **Não trocar a paleta sem decisão registrada.**
- **Anti-Arco-Íris (95% monocromático):** sem azul, verde ou violeta de marca em botões. Botão primário é **monocromático** (`--accent-primary`). Seleção e foco também monocromáticos.
- **Cor só para fatos:** a matriz de status canônica (tons suaves, D-80: cinza = em andamento, azul = aguardando retorno, âmbar = prazo < 24h em Demandas / ≤ 3 dias em Cadastros e Implantação (D-71), coral = atrasada/crítica, verde = concluída, só no histórico). Fases de serviço e situação de canal **não têm cor** (ícone + brilho).
- **Micro-dots de 6px** em CSS puro (`w-1.5 h-1.5 rounded-full`), sempre com rótulo acessível e tooltip.
- **Zero emojis** na interface e no código de interface. Ícones **Lucide**, traço `1.75px`, 18–20px em navegação, 16px em linhas.
- **Escala ergonômica:** linhas de tabela/lista com **44px**; texto base **14–15px**.
- **Zero elementos flutuantes:** nada de FAB, pílulas flutuantes ou toasts. Ações ficam no topo, nos cabeçalhos ou em menus ancorados. Confirmação de salvar acontece no próprio botão ("Salvo").
- **Molas (Framer Motion):** usar os presets de `design-tokens-and-laws.md` (`taptic`, `drawer`, `tabIndicator`, `chartBarReveal`). Montagem escalonada de **0,035s**, limite de 15 linhas, **só na primeira abertura de cada aba** (ao voltar para a aba, nada reanima).
- **Contraste WCAG 2.2 AA** nos dois temas.

### Checklist de verificação visual (toda etapa)
- [ ] Nenhum emoji
- [ ] Nenhum elemento flutuante / toast
- [ ] Nenhuma cor fora da matriz de status e dos tokens
- [ ] Linhas de 44px, texto 14–15px, ícones nos tamanhos certos
- [ ] Funciona e está bonito nos dois temas
- [ ] Navegável por teclado, com foco visível
- [ ] Nenhum nome de empresa/cliente/canal fixo no código

---

## 5. Regras de comportamento do sistema

- **Tempo real é fundação:** toda alteração salva chega a todos os conectados em menos de 1 segundo (D-63).
- **Edição:** registro abre em modo leitura → **Editar** trava o registro inteiro para quem clicou → **Salvar** (`Ctrl+S`) grava tudo → **Esc** descarta (segundo Esc confirma se houver alterações). **Sem salvamento automático campo a campo** (D-64, D-65, D-70).
- **Trava:** disputa resolvida no banco (o primeiro vence); liberação após 2 min sem conexão ou 15 min sem atividade; Administrador pode assumir a edição.
- **Ações livres mesmo com trava:** comentar e "confirmar minha parte". Situação de canal na Matriz é um clique (D-66).
- **Perfis (3):** Administrador, Analista de Implantação, Operador de Rotina (D-54). Permissões em `seguranca-e-cofre.md` e nas specs v2.
- **Cofre:** AES-256-GCM, IV de 12 bytes, `key_version`. **Sem** auditoria de acesso e **sem** limpeza de clipboard (decisões do usuário — não reintroduzir).
- **IDs:** gerados pelo sistema por tipo de entidade (`identificadores-e-formatos.md`).
- **White-label:** nome da instância, logos, catálogo de canais, PMS, serviços e textos de mensagem vêm do banco (Configurações).
- **"Em breve":** Dados Técnicos completos, Checklist de Onboarding, Linha do Tempo de Cadastros e Etapas dos Cadastros aparecem como bloco "Em breve" na Fase 1. Não implementar além disso.

---

## 6. Stack e decisões técnicas

| Camada | Escolha |
| :--- | :--- |
| Framework | Next.js (App Router) + TypeScript |
| Estilo e componentes | Tailwind CSS + shadcn/ui (Radix) — componentes ajustados aos tokens do projeto |
| Animação | Framer Motion |
| Estado de interface | Zustand |
| Ícones | Lucide |
| Banco | PostgreSQL |
| ORM | **Prisma** — a "ponte" entre o código e o banco: descreve as tabelas num arquivo legível e cria/atualiza o banco com segurança (migrações). |
| Autenticação | **Better Auth** com 2FA por TOTP (Google Authenticator). Confirmar que atende a: senha temporária com troca obrigatória, 3 perfis, sessão que expira. Se não atender, HARD STOP e apresentar alternativa. |
| Tempo real | Servidor próprio, porque a hospedagem será uma **VPS** (ainda não contratada). Propor a solução (ex.: WebSocket ou SSE com PostgreSQL LISTEN/NOTIFY) na etapa 1.0 e pedir aprovação. |
| Anexos & Drive | Inserção direta de links manuais com detecção de URLs do Google Drive/Docs e abertura em 1 clique (desacoplado do Google Picker API). |

### Ambiente
- **Desenvolvimento:** no computador do usuário (Windows), em `localhost`. Antes de instalar qualquer coisa (Node.js, PostgreSQL, Docker…), HARD STOP explicando o que é e como instalar.
- **Produção:** VPS própria, ainda não contratada. Quando chegar a hora de publicar, HARD STOP para ajudar o usuário a escolher e configurar.
- **Não usar Vercel nem Cloudflare Pages** para testar este sistema: elas não mantêm conexões permanentes, e o tempo real depende disso.

### Código
- Organização por domínio (`src/features/…`), como em `principios-arquiteturais.md`.
- **Catálogo de componentes** em `/dev/componentes`: todos os componentes-base nos dois temas. Construído na etapa 1.0, antes de qualquer módulo, e atualizado sempre que um componente mudar.
- Todo componente usa as variáveis CSS dos tokens; **nenhuma cor escrita direto** no componente.

---

## 7. Skills e ferramentas

Use quando estiverem disponíveis. Se uma não estiver instalada, diga ao usuário como instalar (comando `/plugin` no Claude Code) e siga sem ela — nunca trave o trabalho por falta de skill.

| Skill / ferramenta | Quando usar |
| :--- | :--- |
| **frontend-design** | Ao construir qualquer tela ou componente. **As leis da seção 4 têm prioridade** sobre qualquer sugestão estética da skill. |
| **Design** (design-system, design-critique, accessibility-review) | Etapa 1.0 (catálogo de componentes) e revisão visual ao fim de cada etapa. |
| **Playwright** | Prints das telas nos dois temas ao fim de cada etapa. |
| **Axe Accessibility** | Etapa 1.8 e sempre que houver dúvida de contraste ou teclado. |

---

## 8. Proibido

- Emojis na interface.
- Botões ou avisos flutuantes, toasts.
- Azul, verde ou violeta como cor de marca / botão.
- Nomes fixos de empresa, clientes ou canais no código.
- Salvamento automático em formulários de edição.
- Auditoria de acesso no Cofre e limpeza automática de clipboard.
- Segredos fora do `.env.local`.
- Avançar de etapa sem aprovação, ou continuar depois de um HARD STOP sem a resposta do usuário.
