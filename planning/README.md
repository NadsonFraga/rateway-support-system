# Rateway Support System - Índice Geral de Planejamento

Este diretório contém o planejamento modular em cascata do **Rateway Support System** (Rateway Operations Hub). Toda funcionalidade, princípio de design e módulo de negócio está dividido em arquivos dedicados, garantindo clareza de contexto e fácil manutenção tanto para humanos quanto para agentes de inteligência artificial.

---

## Estrutura de Diretórios e Especificações

```
planning/
├── README.md                                          # Este índice geral de navegação
├── 00-visao-geral/
│   ├── objetivos-do-projeto.md                        # Visão, escopo, premissa desktop e contexto operacional
│   ├── principios-arquiteturais.md                    # Filosofia white-label, stack técnica e modularidade
│   └── registro-de-decisoes.md                        # Decisões de produto e design, com data e motivo
├── 01-regras-gerais/
│   ├── design-tokens-and-laws.md                      # CANÔNICO: tokens, escala ergonômica, status, molas
│   ├── design-system.md                               # Parcialmente substituído (ver aviso no topo)
│   ├── identificadores-e-formatos.md                  # Gerador de IDs por entidade e máscaras white-label
│   └── seguranca-e-cofre.md                           # Cofre de credenciais, criptografia e RBAC
├── 02-estrutura-e-navegacao/
│   ├── sistema-de-abas.md                             # Abas com keep-alive, atalhos globais e ciclo de vida
│   └── barra-superior-e-lateral.md                    # Top bar, breadcrumbs Windows 11, sidebar redimensionável
├── 03-modulos/                                        # (ESPECIFICAÇÕES FUNCIONAIS COMPLETAS)
│   ├── dashboard/
│   │   ├── dashboard-spec.md                          # v1 funcional (substituída onde conflitar com a v2)
│   │   └── dashboard-design-v2.md                     # v2: design do Início (Fase 1)
│   ├── demandas/
│   │   └── demandas-spec.md                           # Especificação completa de tarefas, filtros e drawer lateral
│   ├── clientes/
│   │   ├── clientes-spec.md                           # v1 funcional (substituída onde conflitar com a v2)
│   │   └── clientes-design-v2.md                      # v2: design da listagem, ficha e 5 sub-abas
│   ├── cadastros/
│   │   ├── cadastros-spec.md                          # v1 funcional (substituída onde conflitar com a v2)
│   │   └── cadastros-design-v2.md                     # v2: design da Matriz e da Fila de prioridades (Fase 1)
│   └── configuracoes/
│       ├── configuracoes-spec.md                      # v1 funcional (substituída onde conflitar com a v2)
│       └── configuracoes-design-v2.md                 # v2: design de Configurações e da tela de login
└── 04-roadmap-e-backlog/
    └── fases-de-implementacao.md                      # OFICIAL: Fase 1 (etapas 1.0–1.8), Fases 2 e 3, backlog
```

---

## Status do Planejamento

- [x] **Visão Geral e Arquitetura:** Escopo 100% desktop, premissa white-label, stack Next.js + PostgreSQL.
- [x] **Regras Gerais:** Design system neutro (Windows 11 + Linear), política zero emojis, cofre AES-256-GCM.
- [x] **Navegação Shell:** Sistema de abas com keep-alive, breadcrumbs Windows 11, sidebar redimensionável.
- [x] **Módulo de Demandas:** Colaboração multi-atribuída, ciência/leitura, aprovação coletiva opcional e drawer.
- [x] **Módulo de Clientes (Ponto 04):** design v2 concluído em `03-modulos/clientes/clientes-design-v2.md`. Dados Técnicos completos, Checklist e Gestão Contratual ficam para depois da Fase 1.
- [x] **Consolidação das Leis de Design (Ponto 04.0):** tokens canônicos, matriz de status, contraste WCAG, gerador de IDs. Ver `registro-de-decisoes.md`.
- [x] **Módulo de Cadastros (Ponto 05):** design v2 da Matriz e da Fila em `03-modulos/cadastros/cadastros-design-v2.md`. Linha do tempo e passo a passo por canal ficam para a próxima fase.
- [x] **Dashboard / Início (Ponto 06):** design v2 em `03-modulos/dashboard/dashboard-design-v2.md`.
- [x] **Configurações e Login (Ponto 07):** design v2 em `03-modulos/configuracoes/configuracoes-design-v2.md`.
- [x] **Estruturação em Fases:** `04-roadmap-e-backlog/fases-de-implementacao.md` (Fase 1 em 9 etapas com critério de pronto; Fases 2 e 3).
- [x] **Edição, trava e tempo real em Demandas:** seção 5 de `03-modulos/demandas/demandas-spec.md`.
