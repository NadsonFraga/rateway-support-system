# Princípios Arquiteturais e Fundação Técnica

## 1. Pilares Arquiteturais Centrais

### 1.1 Motor 100% White-Label e Agnóstico
O código-fonte do repositório NÃO deve conter referências engessadas a empresas específicas, clientes reais ou credenciais proprietárias.
- **Entidades Abstratas:**
  - `Entity` ou `Client` em vez de referências corporativas fixas.
  - `IntegrationTarget` ou `Channel` em vez de listas estáticas de canais.
  - `PipelineStage` em vez de etapas de implantação travadas no código.
- **Configuração Dinâmica da Instância:** Nome da plataforma e logotipos são carregados a partir da tabela de configurações globais (`system_settings`) no banco de dados. A paleta é fixa e monocromática para todas as instâncias (D-28, D-53).

### 1.2 Modularidade por Domínio (Feature-First)
A aplicação organiza seus arquivos em torno dos domínios de negócio, e não apenas em pastas técnicas genéricas:
```
src/features/
├── tasks/                 # Módulo operacional de demandas e tarefas
├── entities/              # Ficha de clientes e especificações cadastrais
├── checklists/            # Motor de checklists dinâmicos por fase
├── channels-vault/        # Cofre criptografado de credenciais e extranets
└── settings/              # Configurações de conta e de instância
```

### 1.3 Estado Persistente de Abas (Keep-Alive)
Inspirado na usabilidade de navegadores e do Obsidian, alternar entre abas não destrói o estado nem os dados digitados em formulários. Os componentes inativos permanecem na árvore DOM com ocultação via CSS (`hidden` / `display: none`), eliminando requisições desnecessárias ao banco e preservando inputs não salvos.

---

## 2. Stack Tecnológica Recomendada

| Camada | Tecnologia Selecionada | Motivo da Escolha Técnica |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (React / App Router)** | Suporte completo a Server Components, SSR para carregamento instantâneo e Server Actions unificadas. |
| **Estilização e Primitivas** | **Tailwind CSS + Shadcn UI (Radix UI)** | Base sem estilo padrão engessado com controle absoluto do código-fonte para implementar o design system. |
| **Física e Microinterações** | **Framer Motion** | Transições orgânicas com física de mola (*spring physics*) para painéis laterais, indicadores de abas e microinterações. Pacote atual: `motion` (novo nome do Framer Motion). |
| **Ícones** | **Lucide Icons** | Conjunto moderno e geométrico, alinhado à linguagem visual do Linear e Windows 11. |
| **Gerenciamento de Estado** | **Zustand** | Store reativa, leve e sem boilerplate para abas abertas, drawer ativo e preferências de interface. |
| **Banco de Dados e ORM** | **PostgreSQL + Prisma** (D-76) | Integridade relacional estrita para clientes, demandas e checklists com tipagem de ponta a ponta. |
| **Autenticação** | **Better Auth** (D-76) | Login com e-mail, senha e Google Authenticator (TOTP), perfis e expiração de sessão (D-73). |
| **Criptografia do Cofre** | **Node.js Crypto (AES-256-GCM)** | Padrão auditável de autenticação e criptografia em repouso para credenciais de canais. |
| **Comunicação em Tempo Real** | **Socket.IO (WebSocket) + PostgreSQL LISTEN/NOTIFY**, servidor próprio na VPS (D-63, D-75) | Toda alteração salva chega a todos em menos de 1s; presença e detecção de desconexão para a trava de edição (D-65). |

---

## 3. Integração com o RMS Principal (Autenticação Única / SSO)

> **Fase posterior (D-55, D-57).** Na Fase 1 o sistema tem login próprio (e-mail, senha e Google Authenticator) e funciona separado do RMS. O fluxo abaixo descreve a integração futura.

O sistema operará em um subdomínio no mesmo servidor/domínio do RMS principal (ex.: `hub.seudominio.com` e `rms.seudominio.com`).
1. **Lançador no RMS:** Ao clicar no botão de acesso dentro do RMS, o painel abre em uma nova guia do navegador (`target="_blank"`), sem fechar o trabalho em andamento no RMS.
2. **Handshake de Autenticação:** A transição de usuário ocorre de forma transparente através de token assinado (JWT) de curta duração ou cookies de sessão compartilhados de nível de domínio (`.seudominio.com`).
3. **Múltiplo Fator (2FA):** A validação do Google Authenticator já efetuada no RMS é validada via token de SSO, dispensando que o operador digite o código de 6 dígitos uma segunda vez.
