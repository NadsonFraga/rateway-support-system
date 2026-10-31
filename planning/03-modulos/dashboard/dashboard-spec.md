# Especificação Funcional: Módulo Dashboard (Tela de Início)

## 1. Visão Geral do Módulo

O **Dashboard Inicial (Início)** é o ponto de entrada diário de todos os colaboradores ao abrir o sistema. Ele foi projetado para responder em menos de 5 segundos de leitura:
1. *Existe algum problema urgente ou aviso crítico hoje?*
2. *Quais são as minhas prioridades de trabalho imediatas?*
3. *Como está o andamento das implantações da minha responsabilidade?*

O módulo opera em container fixo de 100vh com rolagem interna isolada, sem emojis na interface, utilizando exclusivamente ícones vetoriais da biblioteca Lucide e proporções óticas contidas.

---

## 2. Estrutura Visual do Dashboard

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  MURAL DE AVISOS OPERACIONAIS (Central de Reservas & Gestão)                           │
│  ┌─ [Alerta Vermelho Sutil] Instabilidade na extranet da Decolar hoje à tarde ────────┐ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│  ┌─ MINHAS DEMANDAS PRIORITÁRIAS (4) ───────┐ ┌─ ESTEIRA DE CADASTROS (Implantação)* ─┐ │
│  │ Tarefas sob minha responsabilidade       │ │ Visão rápida da equipe de onboarding  │ │
│  │                                          │ │                                       │ │
│  │ • [ico 16px] Booking.com • Hotel Sol     │ │ • Em Andamento: 6 estabelecimentos    │ │
│  │   Ajustar tarifas de verão • Prazo: Hoje │ │ • Próximos do Prazo (< 7 dias): 2     │ │
│  │                                          │ │ • Aguardando Canal: 3 parceiros       │ │
│  │ • [ico 16px] Airbnb • Pousada Mar Azul   │ │                                       │ │
│  │   [Novo] Validar fotos • Prazo: Amanhã   │ │ [ Ir para Esteira de Cadastros ➔ ]    │ │
│  │                                          │ └───────────────────────────────────────┘ │
│  │ [ Ver todas as minhas demandas (14) ➔ ]  │                                           │
│  └──────────────────────────────────────────┘                                           │
│                                                                                        │
│  ┌─ RESUMO DE PRODUTIVIDADE DO DIA ──────────────────────────────────────────────────┐ │
│  │ [ico] 12 demandas concluídas hoje pela equipe • Você concluiu 3 entregas           │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detalhamento dos Componentes

### 3.1 Mural de Avisos Operacionais (Central de Reservas & Gestão)
- **Avisos Globais de Infraestrutura:** Comunicados da administração (ex.: *"Sistema da FOCO em manutenção das 18h às 19h"* ou *"Instabilidade na extranet da Decolar"*).
- **Avisos Específicos de Hotéis:** Alertas emitidos por analistas tarifários ou atendentes da Central de Reservas sobre estabelecimentos com regras temporárias críticas (ex.: *"Pousada Mar Azul: mínimo de 3 diárias no pacote de Réveillon"*).
- **Comportamento Dinâmico:** Se não houver nenhum aviso crítico ativo, esta faixa permanece recolhida/oculta, concedendo mais espaço vertical aos blocos de tarefas.

### 3.2 Minhas Demandas Prioritárias (Limitador Inteligente)
- Exibe estritamente as tarefas em que o **colaborador logado está atribuído**, ordenadas por urgência e proximidade do prazo limite.
- **Limitador de Carga Cognitiva:** Exibe no máximo os 4 ou 5 itens mais críticos.
- **Ações Rápidas no Card:**
  - Clique na demanda: abre o Drawer lateral imediatamente.
  - Indicador `Novo`: permite marcar ciência rápida com 1 clique.
- **Link de Expansão:** Botão no rodapé `[ Ver todas as minhas demandas (X) ➔ ]` que abre o módulo completo de Demandas com o filtro `"Atribuídas a mim"` já ativado.

### 3.3 Esteira de Cadastros (Widget Condicional por Perfil)
- **Para a Equipe de Cadastros e Administradores:**
  - Indicadores numéricos consolidados: estabelecimentos em andamento, projetos próximos do prazo (< 7 dias) e parceiros aguardando validação de canal.
  - Botão de atalho rápido direto para o módulo de Cadastros.
- **Para Colaboradores que Não Fazem Cadastros (ex.: Atendimento / Central de Reservas):**
  - O widget se adapta automaticamente para exibir o **Feed de Notas Recentes de Clientes** da carteira do colaborador, mantendo a tela útil para cada função.

### 3.4 Resumo de Produtividade do Dia
- Linha sutil no rodapé que traz feedback de entrega diária:
  `"12 demandas concluídas hoje pela equipe • Você participou de 3 entregas"`
- Oferece senso de progresso e ritmo de equipe sem gerar poluição visual.
