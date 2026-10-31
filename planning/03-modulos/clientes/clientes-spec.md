# Especificação Funcional: Módulo de Clientes

## 1. Visão Geral do Módulo

O módulo de **Clientes** é o repositório central de estabelecimentos (hotéis, pousadas e resorts) atendidos pela plataforma. Ele unifica a esteira de demandas específicas, os dados técnicos cadastrais, os checklists de auditoria, o cofre de credenciais de canais e a gestão básica de contratos e cobranças.

O módulo opera em container fixo com rolagem interna isolada, sem emojis na interface, utilizando ícones vetoriais da biblioteca Lucide e proporções óticas equilibradas.

---

## 2. Listagem e Diretório Geral de Clientes

A tela inicial do módulo de Clientes organiza a carteira através de:

### 2.1 Filtros Fixos por Modalidade de Serviço
- `Assessoria`
- `Cadastro / Revisão`
- `Central de Reservas`
- `Consultoria`

### 2.2 Busca e Filtros Complementares
- Campo de busca instantânea por: Nome Fantasia, Código Identificador padronizado (ex.: `#SDT-001`) ou Cidade/UF.
- Filtro por status de atividade: `Ativo`, `Em Implantação`, `Pausado`, `Cancelado`.
- Alternador de visualização: Tabela em Lista compacta (linhas entre 36px e 40px) ou Cards de estabelecimentos.

---

## 3. Ficha Interna do Estabelecimento (Estrutura de Tela)

Ao abrir um cliente (pela listagem, pela busca global `Ctrl + K` ou pela árvore expansível da barra lateral), a guia é instanciada com a seguinte hierarquia:

### 3.1 Cabeçalho Fixo do Cliente (Top Banner)
```
┌─ Ficha do Estabelecimento ─────────────────────────────────────────────────────────────┐
│ [ico 18px] Senhor dos Trilhos (#SDT-001) [↗ Site]  [Assessoria] [Ativo]  [⚙ Config]    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ⚠ AVISO IMPORTANTE: Mínimo de 3 diárias obrigatório em todos os canais para o Réveillon.│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Visão Geral ]  [ Dados Técnicos ]  [ Checklist ]  [ Canais & Acessos ]  [ Financeiro ] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Identificador e Link Externo Direto:** Mini-avatar com o logo do estabelecimento + Nome + `#SDT-001`. Ao lado do nome, um ícone discreto (`↗`) abre o site oficial / motor de reservas do hotel diretamente em uma nova guia do navegador.
- **Faixa de Alerta / Comunicado do Cliente:** Exibida apenas se houver uma nota crítica ativa (ex.: bloqueios tarifários, avisos para a Central de Reservas, pendências contratuais).
- **Configurações do Estabelecimento (`⚙`):** Modal para editar dados mestres, contatos, status e parâmetros contratuais.

---

## 4. Estrutura das 5 Sub-Abas Internas

### Sub-aba 1: Visão Geral (Dashboard do Cliente)
- **Sistemas em Operação:**
  - `Channel Manager:` Badge da plataforma integradora (ex.: Foco Channel, Omnibees).
  - `PMS do Hotel:` Badge do software hoteleiro local (ex.: Hospedin, Desbravador, Cloudbeds, Silbeck).
- **Demandas Ativas do Hotel:** Tabela compacta com as tarefas operacionais vinculadas exclusivamente a esse cliente, com botão rápido de `+ Nova Demanda` (que já abre com o hotel pré-selecionado).
- **Resumo de Cadastros / Implantação:**
  - Visível para colaboradores com permissão na esteira de implantação.
  - Exibe um resumo horizontal compacto com o status de cada canal a ser homologado (ex.: *Booking: Conectado*, *Airbnb: Em Análise*, *Expedia: Pendente*) com link direto para a esteira completa de Cadastros.

### Sub-aba 2: Dados Técnicos do Estabelecimento
Repositório central de dados padronizados para cadastros externos sem necessidade de consulta a planilhas soltas (dados alimentados manualmente ou capturados via checklist):
- **Contatos-Chave do Hotel:**
  - Contato Operacional / Gerente (Nome, Telefone, WhatsApp).
  - Contato Financeiro (Nome, E-mail, WhatsApp de cobrança).
  - URL do Site Oficial / Motor Próprio.
- **Dados Cadastrais:** Razão Social, CNPJ, Inscrição Estadual/Municipal, Endereço completo com CEP e link de mapa/coordenadas GPS.
- **Políticas Operacionais:** Horário padrão de Check-in e Check-out, voltagem das tomadas (110V/220V), políticas de cancelamento, regras para crianças, animais de estimação (pets) e fumantes.
- **Descritivos Institucionais:** Textos comerciais pré-aprovados do hotel prontos para cópia rápida em extranets.

### Sub-aba 3: Checklist Dinâmico
- Estrutura hierárquica de tarefas de auditoria e revisão cadastral organizadas por fases.
- Caixas de seleção com gravação de data/hora do clique e colaborador responsável.
- Campo de anotações rápidas para registrar impedimentos (ex.: *"Aguardando fotos em alta resolução da piscina"*).

### Sub-aba 4: Canais & Acessos (Cofre Seguro de Extranets)
Cards verticais individuais para cada parceiro de venda vinculado ao hotel:

```
┌─ [ico 16px] Booking.com ───────────────────────────── [ ID: 104928 ⎘ ] ─┐
│                                                                         │
│ Login / Usuário:                                                        │
│ [ reservas@hotelson.com.br                                       [⎘] ] │ ◀ Clique copia
│                                                                         │
│ Senha:                                                                  │
│ [ ••••••••••••••••                                      [👁]     [⎘] ] │ ◀ Olho revela / Clique copia
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                  [ 🌐 Abrir Extranet do Canal ]                     │ │ ◀ Abre em nova guia
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Mecânica de Acesso:**
  - Clique no campo de Usuário: cópia direta para a área de transferência.
  - Clique no campo de Senha: cópia direta da senha decifrada.
  - Ícone de "olho": revela o texto da senha com permissão de visualização auditada.
  - Botão `"Copiar Acesso Completo"`: copia usuário e senha em sequência para histórico do Windows (`Win + V`).
  - Botão `"Abrir Extranet do Canal"`: abre a URL oficial do parceiro em nova guia do navegador.

### Sub-aba 5: Contrato & Financeiro (Asaas + WhatsApp Quick Charge)
Todos os campos são 100% editáveis no momento do cadastro ou na edição da ficha:
- **Link do Contrato Externo:** Campo para URL de assinatura ou gestão de processos (ex.: link direto no Pipefy, Runrun.it ou sistema de assinatura eletrônica).
- **Regras Comerciais Flexíveis por Serviço Contratado:**
  - Os serviços (Assessoria, Central de Reservas, Cadastros) podem ser contratados em conjunto ou separadamente:
    - *Cadastro / Revisão de Canais:* Data de Início e **Data Limite de Entrega** (sugestão padrão de 30 dias, livremente editável).
    - *Assessoria:* Data de Início e **Tempo Mínimo de Fidelidade** (campo livre em meses/dias, sem vigência final fixa).
    - *Central de Reservas:* Data de Início e **Tempo Mínimo de Fidelidade** (se aplicável no contrato).
    - *Consultoria:* Escopo pontual com horas ou período delimitado.
- **Controle de Faturamento e Cobrança:**
  - Valor da mensalidade ou do projeto.
  - Dia do vencimento mensal da fatura.
  - Link da assinatura/cobrança no **Asaas**.
- **Ação Rápida de Cobrança (WhatsApp):**
  - Botão `[ Cobrar no WhatsApp ]` posicionado ao lado do vencimento.
  - Ao ser clicado, abre o WhatsApp Web / Desktop direcionado ao número do Contato Financeiro cadastrado com mensagem pronta:
    `"Olá [Nome Contato], identificamos que a fatura da Rateway referente ao [Nome Hotel] venceu em [Data] (há [X] dias). Segue o link para pagamento via Asaas: [Link Asaas]..."`
  - O template de mensagem é parametrizável.
