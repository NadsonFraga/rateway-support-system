# Especificação Funcional: Módulo de Cadastros (Esteira de Implantação)

## 1. Visão Geral do Módulo

O módulo de **Cadastros** é a esteira dedicada para a equipe de implantação hoteleira gerenciar a subida, configuração, revisão e homologação de estabelecimentos nos canais de venda (OTAs como Booking.com, Airbnb, Expedia, Decolar, etc.) e integrações com Channel Managers (ex.: FOCO).

O módulo opera em container fixo de 100vh, sem emojis na interface, utilizando ícones vetoriais da biblioteca Lucide e proporções óticas equilibradas.

---

## 2. Visões do Módulo de Cadastros

O topo do módulo oferece um alternador limpo entre duas visualizações operacionais:
- **[ Matriz Geral de Conectividade ]:** Panorama macro de todos os estabelecimentos nas linhas e canais nas colunas.
- **[ Prioridades de Implantação ]:** Fila operacional ordenada por urgência, prazos limites e gargalos (exclusiva para a equipe de cadastros, sem misturar com demandas cotidianas).

---

## 3. Matriz Geral de Conectividade (Visão Macro)

A tela inicial exibe a matriz comparativa de todos os hotéis da esteira:

### 3.1 Cabeçalho e Controles da Matriz
- **Título e Subtítulo:** *"Cadastros — Situação de cada estabelecimento em cada canal."*
- **Filtro de Exibição:** Checkbox no canto superior direito `[ ] Mostrar finalizados` (mantém o foco apenas nos processos ativos por padrão).
- **Legenda Padronizada de Status (Ícones Vetoriais Sutis):**
  - `A cadastrar` (círculo pontilhado / pendente de início)
  - `Em andamento` (círculo bicolor âmbar / em execução técnica)
  - `Ativo` (círculo com check azul/verde / homologado e publicado)
  - `Feito pela FOCO` (círculo com seta indicativa / terceirizado ao Channel Manager)
  - `- Não contratado` (traço neutro cinza / canal fora do escopo do cliente)

### 3.2 Estrutura de Colunas
- `Estabelecimento:` Nome Fantasia + identificador (`#SDT-001`) + subtítulo indicando a modalidade contratada (*Cadastro/Revisão* ou *Assessoria*).
- `Colunas de Canais Dinâmicos:` Booking, Airbnb, Expedia, Decolar, B2B Reservas, Trivago, TripAdvisor, Google Hotels, etc. (alimentadas pelo catálogo de canais da instância).
- `Coluna de Eficiência (Ativos):` Indicador em fração (ex.: `3/7`, `0/3`) informando quantos canais já estão no ar em relação ao total contratado.

### 3.3 Mecânica de Interação na Matriz
- **Clique Simples na Célula:** Abre um micro-menu flutuante (*popover*) para alteração imediata do status daquele canal com 1 clique.
- **Duplo Clique na Célula (ou na linha do cliente):** Abre a **Linha do Tempo de Implantação** completa daquele estabelecimento.

---

## 4. Linha do Tempo de Implantação (Pipeline do Estabelecimento)

A jornada de implantação de cada hotel é estruturada em uma linha horizontal contínua dividida em **Macro-Fases** estritamente ordenadas:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [✓ 1. Contrato] ─▶ [✓ 2. Checklist] ─▶ [● 3. Cadastros OTAs] ─▶ [○ 4. Revisão] ─▶ [○ 5. Channel Manager]* ─▶ [○ 6. Go-Live] │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
  *Fase 5 é condicional (ativada apenas se o hotel utilizar Channel Manager)
```

### 4.1 Sequência Oficial das Macro-Fases
1. **Fase 1: Fechamento de Contrato & Onboarding:**
   - Definição da data de início e prazo limite de entrega (padrão de 30 dias editável).
   - Seleção dos canais contratados para a esteira.
2. **Fase 2: Reunião de Checklist & Coleta de Dados:**
   - Coleta e validação do repositório técnico: fotos oficiais, descritivos, tarifas base, horários e regras operacionais.
3. **Fase 3: Execução dos Cadastros em OTAs (Trilhas Paralelas com Flyout no Hover):**
   - Esta etapa subdivide-se em trilhas paralelas independentes para cada canal contratado.
   - **Pop-up / Flyout ao Passar o Mouse (Hover):**
     - Ao passar o cursor sobre o nó *"3. Cadastros OTAs"*, desce uma janela flutuante elegante listando cada canal contratado com seu mini-logo (16px), nome e barra de progresso individual.
     - Clicar em qualquer canal desse pop-up expande imediatamente o **Drawer de Detalhes Técnicos daquele Canal**.
4. **Fase 4: Revisão & Auditoria de Cadastro (Antes do Channel Manager):**
   - **Regra Crucial:** A auditoria ocorre antes da conexão com o Channel Manager. A equipe confere: fotos, paridade de categorias, restrições mínimas, políticas de cancelamento e textos comerciais dentro de cada extranet.
5. **Fase 5: Conexão com Channel Manager (Condicional Inteligente):**
   - **Regra Dinâmica:** Se o cliente possuir Channel Manager contratado (ex.: FOCO), esta etapa é ativada para mapear categorias de quartos e disparar cargas de sincronização. Se o cliente **não possuir** Channel Manager, o sistema oculta/pula esta fase automaticamente.
6. **Fase 6: Entrega & Finalização (Go-Live):**
   - Envio de termo de entrega dos canais, comunicação oficial ao hotel e marcação do projeto como concluído.

---

## 5. Drawer de Detalhes do Canal & Guia de Passos (SOP)

Ao clicar em um canal específico (seja na trilha ou no pop-up do hover), um painel lateral deslizante (*drawer*) abre na direita com o passo a passo técnico:

```
┌─ Cadastro: Booking.com • Hotel Sol (#SDT-001) ───────────────────────────────────[ x ]─┐
│ Status: [ Em Andamento ▾ ]          Responsável: [ Sarah C. ▾ ]                        │
│ ID Extranet: [ 104928 ⎘ ]          Prazo do Canal: [ 18/Nov/2026 ]                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ GUIA OPERACIONAL DO CANAL (Etapas Padronizadas)                      Progresso: 50%    │
│ [███████████████░░░░░░░░░░░░░░░] 2 de 4 concluídos                                     │
│                                                                                        │
│ [x] 1. Criação da Propriedade & Dados Cadastrais                                       │
│ [x] 2. Upload de Fotos em Alta Resolução & Amenities                                   │
│ [ ] 3. Configuração de Planos de Tarifa e Restrições                                   │
│ [ ] 4. Solicitação de Homologação / Validação Bancária                                 │
│                                                                                        │
│ [+ Adicionar Etapa Customizada para este Hotel]                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ IMPEDIMENTOS & NOTAS TÉCNICAS DO CANAL                                                 │
│ [ Aguardando cliente enviar comprovante bancário com dígito para extranet da Booking. ]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Templates Padrão Parametrizáveis:** Cada OTA possui um conjunto padrão de etapas (cadastrado em Configurações do Sistema), mas o analista de cadastros pode adicionar ou remover passos específicos diretamente no hotel caso o escopo exija.

---

## 6. Painel de Prioridades de Implantação (Fila Operacional)

A visualização de **Prioridades** foi desenhada para a liderança e para a equipe de implantação organizarem o esforço diário sem misturar com as demandas gerais:

### 6.1 Critérios de Ordenação da Fila
1. **Contagem Regressiva do Prazo Limite (Base 30 Dias):**
   - Hotéis com prazo mais próximo do vencimento (ou já atrasados) sobem automaticamente para o topo da fila com sinalização em destaque:
     - `Atrasado há X dias` (badge vermelho sutil)
     - `Vence em X dias` (badge âmbar)
     - `No prazo` (badge neutro)
2. **Nível de Prioridade Manual:**
   - O gestor pode marcar a implantação de um hotel específico como: `Crítica`, `Alta` ou `Normal` (ex.: hotel com inauguração agendada para o feriado).
3. **Filtro por Gargalo (Onde está travado?):**
   - Filtrar hotéis travados por: *Aguardando Documento do Cliente*, *Aguardando Validação de Canal*, ou *Em Produção Interna*.
