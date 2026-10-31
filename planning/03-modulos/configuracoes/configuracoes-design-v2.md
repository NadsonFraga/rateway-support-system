# Configurações e Login — Especificação de Design (v2)

Detalhamento visual e de comportamento de Configurações (sistema e pessoais) e da tela de login para a Fase 1. Segue `01-regras-gerais/design-tokens-and-laws.md` (canônico) e as decisões D-53 a D-60 de `00-visao-geral/registro-de-decisoes.md`. Onde conflitar com `configuracoes-spec.md` (v1), vale este arquivo.

---

## 1. Padrões comuns a todas as telas de configuração

- **Abertura:** Configurações do Sistema (rodapé da sidebar) e Minha Conta (menu do avatar) abrem como **abas** do sistema de abas (ícone `Settings` / `UserRound`), com keep-alive: alterações não salvas sobrevivem à troca de aba.
- **Layout:** navegação vertical de seções à esquerda (220px, itens de 36px, ícone 18px + rótulo 14px, item ativo com fundo `--accent-subdued`) + conteúdo à direita com largura máxima de 760px.
- **Campos:** rótulo 13px `--text-secondary` acima do campo; campo de 36px, `rounded-lg`, fundo `--bg-surface`, borda `--border-subtle`, foco `--border-focus`; ajuda em 12px `--text-muted` abaixo. Erro: borda e texto em coral, mensagem abaixo do campo.
- **Salvar:** botão primário monocromático **no cabeçalho de cada seção** (nunca flutuante), desabilitado até haver alteração. Ao salvar, vira "Salvo" com `Check` por 1,2s (mola `taptic`). Sem toasts flutuantes.
- **Alterações não salvas:** a aba exibe um ponto de 6px `--text-secondary` ao lado do título; ao tentar fechar a aba, confirmação no próprio sistema (sem diálogo do navegador).
- **Listas:** linhas de 44px, mesmo padrão de Clientes; ações no menu da linha (`MoreHorizontal`).

---

## 2. Configurações do Sistema (somente Administrador)

### 2.1 Identidade
- Nome da plataforma (aparece na pílula `[ NOME ]` da barra superior e na aba do navegador).
- Logo para tema escuro, logo para tema claro, favicon: área de upload de 96px com borda tracejada `--border-medium`; após o upload, miniatura com ações "Trocar" e "Remover".
- **Prévia ao vivo:** miniatura da barra superior nos dois temas, atualizada enquanto o administrador digita.
- **Sem seletor de cor de destaque** (D-53).

### 2.2 Identificadores
- Máscara do código de cliente (lista das máscaras de `identificadores-e-formatos.md`).
- Palavras ignoradas na sugestão de sigla (campo de etiquetas: `Hotel`, `Pousada`, `Resort`…).
- Prefixo das demandas (padrão `DEM`).
- **Prévia:** "Próximo cliente: `#HFI-001` · Próxima demanda: `#DEM-0043`" em fonte monoespaçada 14px.

### 2.3 Catálogo
Sub-navegação segmentada: **Canais de venda | Channel Managers | PMS | Serviços internos**.
- Linha: logo 20px, nome 14px medium, URL da extranet 13px `--text-secondary` (canais e Channel Managers), menu da linha.
- **Adicionar:** botão primário no cabeçalho da seção. Modal com nome, logo (PNG/SVG, exibido em 16–20px), URL da extranet e categoria.
- **Arquivar (D-88):** no menu da linha. O item sai das listas e de novos cadastros, mas continua nos clientes que já o usam; "Mostrar arquivados" permite reativar.
- Ordem arrastável (alça `GripVertical` 16px no hover): define a ordem das colunas na Matriz de Cadastros e no Cofre. Ao arrastar, a linha ganha elevação `--bg-surface-elevated` e as demais se reposicionam com mola.

### 2.4 Serviços
- Lista dos 4 serviços padrão com nome editável e tipo (Pontual / Contínuo) em 13px `--text-secondary`.
- Regras comerciais (D-16, D-19) exibidas como texto de ajuda; não editáveis na Fase 1.
- Fases dos serviços: somente leitura na Fase 1 (D-17).

### 2.5 Mensagens
- **Template de cobrança via WhatsApp** (D-38): área de texto de 160px de altura, fonte 14px.
- **Variáveis:** botões-etiqueta acima do campo (`contato_financeiro.nome`, `cliente.nome`, `instancia.nome`, `servico`, `vencimento`); clicar insere `{{variavel}}` na posição do cursor.
- **Prévia:** à direita, a mensagem preenchida com um cliente de exemplo, em balão neutro (`--bg-surface-elevated`, `rounded-xl`), sem verde do WhatsApp.

### 2.6 Membros
- **Linha:** avatar de iniciais 24px, nome 14px medium, usuário (monoespaçada) e e-mail 13px `--text-secondary`, perfil (menu de seleção), 2FA ("Ativo" em `--text-primary` / "Pendente" em `--text-muted`), interruptor de conta ativa.
- **Perfis (3):** Administrador, Analista de Implantação, Operador de Rotina (D-54).
- **Novo membro** (D-62, D-85): botão primário no cabeçalho. Modal com nome, **usuário**, e-mail e perfil. Ao criar, o modal mostra a **senha temporária** gerada pelo sistema (fonte monoespaçada 16px, botão `Copy`) e o aviso "Esta senha só aparece agora. Repasse ao colaborador." O administrador entrega a senha pessoalmente ou por mensagem.
  - **Primeiro acesso:** login com a senha temporária → troca obrigatória de senha (`autocomplete="new-password"`) → configuração do Google Authenticator.
  - **Validade:** a senha temporária expira em 48h; depois disso, o administrador gera outra pelo menu da linha ("Gerar nova senha temporária"). O mesmo item serve para quem esqueceu a senha.
  - **Linha do membro:** enquanto o primeiro acesso não acontece, a coluna 2FA mostra "Aguardando primeiro acesso" em `--text-muted`.
- **Desativar:** interruptor com confirmação no menu da linha; a conta desativada perde o acesso imediatamente e a linha passa para `--text-muted`.

### 2.7 Etapas dos Cadastros (Em breve)
- Item visível na navegação com "Em breve" em 12px `--text-muted`; conteúdo é o bloco tracejado padrão (D-41).

---

## 3. Minha Conta (todos os usuários)

### 3.1 Perfil
- Iniciais ou foto (upload de 96px), nome, e-mail (somente leitura), "Trocar senha" e "Reconfigurar autenticador" (abrem modais curtos que pedem a senha atual).

### 3.2 Atalhos
- **Fase 1 (D-86):** só a tabela, sem edição. O modo de escuta abaixo entra na Fase 2.
- Tabela de 44px: ação (14px) à esquerda; combinação à direita em teclas-badge (fonte monoespaçada 12px, borda `--border-medium`, `rounded-md`, padding 2px 6px).
- **Modo de escuta:** clicar na combinação deixa o badge com borda `--border-focus` pulsando suavemente e o texto "Pressione as teclas…". `Esc` cancela. Conflito com outra ação: aviso em âmbar abaixo da linha ("Já usado em Fechar aba") e o atalho não é salvo até o usuário confirmar a troca.
- "Restaurar padrões" como link 13px no cabeçalho da seção.
- Padrão para nova demanda: `C` (D-59).

### 3.3 Aparência
- **Tema:** controle segmentado Escuro | Claro | Sistema (o fundo do item ativo desliza com a mola `tabIndicator`). A troca de tema aplica uma transição de cor de 200ms nas superfícies (sem piscar).
- A largura da sidebar continua salva automaticamente ao redimensionar (sem controle aqui).

---

## 4. Tela de Login

Login próprio com e-mail, senha e Google Authenticator (D-55), usando uma solução de autenticação pronta (D-56).

```
                    [logo da instância]
                    Entrar no {nome da plataforma}

                    Usuário
                    [                              ]
                    Senha
                    [                              ] [Eye]

                    [            Entrar            ]
```
- **Usuário e senha na mesma tela, no mesmo formulário (D-61, D-85):** o login é por usuário; o e-mail não serve para entrar. Vários colaboradores usam o mesmo computador e o Gerenciador de Senhas do Google. Os dois campos ficam juntos para que o navegador ofereça a lista de contas salvas e preencha usuário e senha de uma vez. Requisitos técnicos:
  - um único `<form>` com `method="post"`; campo de usuário com `type="text"`, `name="username"`, `autocomplete="username"` e `autocapitalize="none"`; campo de senha com `type="password"`, `name="password"` e `autocomplete="current-password"`;
  - nunca dividir em duas telas (primeiro usuário, depois senha);
  - definir senha (primeiro acesso ou troca) com `autocomplete="new-password"`, para o Google oferecer salvar a senha nova;
  - código do autenticador com `autocomplete="one-time-code"` e `inputmode="numeric"`.
- **Computador compartilhado:** "Sair" fica visível no menu do avatar (ícone `LogOut` 16px), e a sessão expira após 2 horas sem uso, com limite máximo de 12 horas (D-73), para um colaborador não continuar logado na conta de outro.
- **Fundo:** `--bg-app`; cartão central de 380px, `--bg-surface`, borda `--border-subtle`, `rounded-2xl`, padding 32px. Sem ilustrações.
- **Entrar:** botão primário monocromático de largura total, 40px. Durante a verificação, o rótulo dá lugar a um indicador de carregamento discreto (sem mudar a largura).
- **Erro:** mensagem genérica em coral 13px abaixo do botão ("Usuário ou senha incorretos"), sem revelar qual dos dois está errado; o cartão faz um leve deslocamento horizontal (mola `taptic`, 4px).
- **Segundo passo (autenticador):** o cartão troca o conteúdo com transição cruzada: "Código do autenticador" + 6 caixas de 44px (fonte monoespaçada 20px). Avanço automático entre as caixas, colar o código de 6 dígitos preenche tudo, envio automático ao completar.
- **Primeiro acesso:** definir senha → QR Code de 180px para o Google Authenticator + código de texto para digitação manual → confirmar com um código de 6 dígitos.
- **Após entrar:** abre o Início com a animação de montagem (primeira abertura do dia).
