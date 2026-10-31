# Especificação Funcional: Módulo de Configurações

## 1. Visão Geral e Arquitetura

O módulo de **Configurações** adota a separação arquitetural estrita entre **Configurações do Sistema (Instância)** e **Configurações da Conta (Pessoal)**, assegurando independência de governança e viabilizando o modelo 100% White-Label.

---

## 2. Configurações do Sistema (Acesso Restrito: Administradores)

Localizado de forma fixa na barra lateral esquerda (no bloco inferior), o painel de configurações da instância organiza-se em 4 núcleos:

### 2.1 Identidade da Instância (White-Label Engine)
- **Nome da Plataforma:** Nome de exibição no cabeçalho e na aba do navegador (ex.: *"Rateway Hub"*, *"Nexus Operations"*).
- **Logotipos Oficiais:** Upload ou link para:
  - Logotipo versão Dark Mode (para fundos escuros).
  - Logotipo versão Light Mode (para fundos claros).
  - Favicon do navegador.
- **Cor Primária de Destaque:** Seletor de cor hexadecimal (ex.: `#0078d4` ou `#5e6ad2`) que injeta variáveis CSS dinâmicas em botões, foco de campos e badges de seleção.
- **Máscara Padronizada de IDs de Clientes:** Definição da convenção de códigos de estabelecimentos (ex.: `[SIGLA]-[NUMERO_3]` ➔ `#SDT-001`).

### 2.2 Catálogo de Canais e Serviços
Central de cadastro dinâmico que abastece os filtros de demandas, os cards do cofre de acessos e as colunas da esteira de cadastros:
- Cadastro de novo canal:
  - Nome do Parceiro (ex.: Booking.com, Airbnb, Expedia, Decolar, B2B Reservas, FOCO Channel).
  - Upload do mini-logotipo oficial em PNG ou SVG (para exibição contida de 16px–18px).
  - URL Base oficial de login da extranet.
  - Categoria: *Canal de Venda (OTA)*, *Channel Manager* ou *Serviço Interno* (Auditoria, Revisão, Tarifário).

### 2.3 Templates de Etapas de Cadastros (SOP da Esteira)
- Definição das etapas padronizadas que surgem no guia operacional de cada canal na esteira de implantação (ex.: *Criação de Conta*, *Upload de Fotos/Políticas*, *Mapeamento de Tarifas*, *Homologação Bancária*).
- Permite que o administrador altere o passo a passo padrão sem precisar mexer em código.

### 2.4 Gestão de Membros, Cargos e Segurança (Autenticação Autônoma)
- **Autenticação Desacoplada Inicial:**
  - Login padrão por E-mail + Senha com hash criptográfico seguro (Argon2 / bcrypt).
  - Suporte a **Autenticação em Dois Fatores (2FA) via Google Authenticator (TOTP)** com QR Code no onboarding do usuário.
- **Controle de Cargos e Permissões (RBAC):**
  - `Administrador:` Acesso irrestrito a configurações, painel administrativo, exclusões e override de travas.
  - `Analista de Implantação:` Gestão de fichas de clientes, edição de checklists e esteira de cadastros.
  - `Operador de Suporte / Tarifário:` Criação e execução de demandas, visualização de dados técnicos e cópia de acessos de canais.
  - `Central de Reservas:` Acesso a avisos operacionais, consulta rápida de estabelecimentos e políticas de clientes.
- **Status da Conta:** Ativar ou desativar colaboradores em 1 clique.

---

## 3. Configurações da Conta (Acesso Pessoal de Cada Colaborador)

Acessado pelo menu do Avatar no canto superior direito:

### 3.1 Perfil Individual
- Foto ou iniciais de exibição.
- Nome e e-mail.
- Configuração do Google Authenticator (2FA pessoal).

### 3.2 Mapa de Atalhos Personalizados (Action Registry)
- Tabela com ações do sistema e combinações de teclas:
  - Fechar aba (`Ctrl + W`)
  - Alternar abas (`Ctrl + Tab` / `Ctrl + Shift + Tab`)
  - Abrir busca rápida (`Ctrl + K`)
  - Nova demanda rápida (`C`)
- Modo de escuta: clicar no atalho e pressionar nova combinação no teclado físico salva a preferência individualmente para aquele colaborador, sem afetar os colegas.

### 3.3 Preferências Visuais
- Tema: `Dark Mode`, `Light Mode` ou `Automático (do Sistema Operacional)`.
- Largura preferida da barra lateral salva automaticamente após o redimensionamento.
