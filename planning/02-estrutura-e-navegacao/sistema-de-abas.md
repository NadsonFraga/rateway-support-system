# Especificação do Sistema de Abas

## 1. Visão Geral e Funcionamento

A barra superior de abas opera como o núcleo multitarefa do sistema, reproduzindo a experiência ergonômica de navegadores web, do Obsidian e do Bloco de Notas do Windows 11.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Home Início] [Building2 Hotel Sol Nascente  ×] [ClipboardList Demanda #DEM-1048  ×]  [+]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ciclo de Vida e Comportamento das Guias

1. **Aba Início Fixa e Não Fechável:**
   - A guia principal `Início` (Dashboard) permanece sempre ancorada como a primeira aba e não exibe botão de fechar, assegurando que o operador nunca fique com a tela em branco.
2. **Botão Nova Aba (`[+]`):**
   - Posicionado imediatamente contíguo à última aba aberta.
   - Ao ser clicado, abre uma nova guia limpa apontada para o Dashboard Inicial ou seletor rápido.
3. **Anatomia Visual da Guia:**
   - **Ícone de Contexto:** Reflete o tipo de recurso aberto com ícones Lucide 16px (Início `Home`, Hotel/Cliente `Building2`, Demanda `ClipboardList`, Cadastros `Rocket`, Configurações `Settings`). Busca e perfil ficam na Top Window Chrome, não na faixa de abas.
   - **Título com Limite:** Truncado em aproximadamente 20 caracteres com reticências para evitar estouro horizontal.
   - **Botão Fechar (`×`):** Exibido de forma contínua na aba ativa; exibido sob o cursor (*hover*) nas abas em segundo plano.
4. **Preservação de Estado (Keep-Alive):**
   - A alternância entre abas NÃO destrói os componentes em memória nem limpa formulários em andamento.
   - As abas inativas são mantidas na árvore DOM e ocultadas via CSS (`hidden` / `display: none`), permitindo que analistas preencham checklists extensos sem perda de progresso ao checar outras guias.

---

## 3. Atalhos Globais e Registro de Ações (Action Registry)

Os atalhos de navegação não são fixos no código; eles são vinculados a um **Action Registry**, permitindo que cada colaborador personalize suas combinações nas preferências da conta (personalização na Fase 2):

| Identificador da Ação | Atalho Padrão (D-81) | Descrição Funcional |
| :--- | :--- | :--- |
| `tabs.new` | `Alt + T` | Abre uma nova aba limpa |
| `tabs.close` | `Alt + W` | Fecha a aba ativa (exceto a aba Início) |
| `tabs.next` | `Alt + .` | Alterna para a próxima aba à direita |
| `tabs.prev` | `Alt + ,` | Alterna para a aba anterior à esquerda |
| `command_bar.open` | `Ctrl + K` | Abre a paleta de comandos rápida |

> Ctrl+T, Ctrl+W e Ctrl+Tab são reservados pelo Chrome para as abas do próprio navegador e não podem ser usados (D-81).

5. **Clique (D-94):** o clique normal troca o conteúdo da aba atual; Ctrl+clique, Shift+clique ou botão do meio abrem em aba nova. A aba Início e abas com alterações não salvas nunca são substituídas (o destino abre em aba nova).
6. **Reabrir abas (D-84):** a lista de abas abertas fica guardada no navegador e é reaberta no F5 ou no dia seguinte.
