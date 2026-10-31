# Objetivos do Projeto e Escopo Principal

## 1. Resumo Executivo

O **Rateway Support System** (operando internamente como o hub operacional para suporte e gestão hoteleira da Rateway) é uma plataforma interna de trabalho desenhada para centralizar a esteira de implantação de hotéis em canais de venda (OTAs como Booking.com, Airbnb, Expedia, etc.), o fluxo colaborativo de demandas diárias da equipe e a custódia segura de dados cadastrais e credenciais de acesso.

O projeto é concebido desde a sua raiz como um **motor universal agnóstico e 100% White-Label**, sem marcas, clientes ou regras proprietárias fixas no código-fonte, garantindo versatilidade técnica para ser publicado como código aberto ou operado em diferentes instâncias.

---

## 2. Objetivos Primários

1. **Centralização da Operação:** Substituir planilhas dispersas, documentos soltos no Drive e gerenciadores externos por uma estação de trabalho única com histórico e rastreabilidade.
2. **Agilidade no Acesso a Canais:** Fornecer acesso instantâneo e seguro a extranets de canais de venda com credenciais criptografadas e cópia rápida em um clique.
3. **Gestão Colaborativa de Demandas:** Implementar um fluxo de tarefas com suporte a múltiplos colaboradores por demanda, indicador visual de ciência (leitura) e travas de aprovação coletiva (*sign-off* conjunto).
4. **Ergonomia com Sistema de Abas:** Oferecer uma experiência de aplicativo desktop no navegador, permitindo alternar entre múltiplos clientes e demandas via abas com preservação de memória (*keep-alive*), impedindo a perda de dados durante o preenchimento de cadastros longos.
5. **Arquitetura Modular Limpa:** Construir uma base desacoplada por domínios de negócio (*Feature-First*), viabilizando implementações guiadas por agentes de inteligência artificial de forma segura e sem regressões.

---

## 3. Premissas de Plataforma e Hardware

- **Plataforma:** Exclusivamente navegador web (*Desktop-First*).
- **Sem Interface Mobile Inicial:** Zero esforço em telas de celular nesta fase inicial. O foco total está na ergonomia pesada para operadores que trabalham com teclado e mouse.
- **Resolução de Referência:** Desenvolvido nativamente para monitores **Full HD (1920x1080)** e telas amplas/ultrawide, com layout fluido e elástico (flex/grid) que aproveita com elegância o espaço horizontal amplo, adaptando-se confortavelmente caso redimensionado em telas menores.
- **Estrutura de Viewport:** Janela com altura fixa (`100vh`, `overflow-hidden`), onde cabeçalho, abas e barra lateral ficam imóveis e apenas os painéis centrais rolam verticalmente de forma suave.

---

## 4. Perfis de Usuário Atendidos

| Papel na Operação | Função Principal | Principais Telas Utilizadas |
| :--- | :--- | :--- |
| **Analista de Cadastros / Implantação** | Cadastra hotéis em OTAs, audita mapeamento de tarifas e valida fotos | Esteira de Cadastros, Dados Técnicos do Cliente, Cofre de Canais |
| **Operador de Suporte / Tarifário** | Executa ajustes de tarifas, resolução de inconsistências e suporte | Demandas, Dashboard Inicial, Ficha do Cliente |
| **Agente da Central de Reservas** | Atendimento operacional, tira dúvidas de clientes e verifica regras | Mural de Avisos Operacionais, Consulta Rápida de Clientes |
| **Administrador do Sistema** | Parametriza branding, permissões de equipe, catálogo de canais e templates | Configurações do Sistema, Gestão de Usuários, Catálogo de Canais |

