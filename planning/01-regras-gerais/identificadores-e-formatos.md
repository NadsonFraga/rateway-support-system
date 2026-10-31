# Gerador de Identificadores (ID Generator)

## 1. Princípio

Nenhum identificador é fixado no código. Todo código legível (`#XXX-001`) é **gerado pelo sistema no momento da criação da entidade**, seguindo uma máscara configurável na instância (white-label).

Cada registro tem dois identificadores com papéis diferentes:

| Campo | Exemplo | Papel |
| :--- | :--- | :--- |
| `id` (UUID) | `3f9c…a21` | Chave real do banco. Nunca aparece na interface. Usada em relações e URLs internas. |
| `display_code` | `HFI-001` | Código legível para humanos: busca, conversas, tickets, abas. Único por tipo de entidade dentro da instância. |

O `#` é apenas visual: não é armazenado.

> Todos os códigos citados nas specs (`#HFI-001`, `#DEM-0042` etc.) são **exemplos ilustrativos** do formato padrão, não dados reais.

---

## 2. Namespaces por Tipo de Entidade

Cada tipo de entidade tem sua própria máscara e seu próprio contador. Isso impede que o código de um cliente seja confundido com o de uma demanda.

| Entidade | Máscara padrão | Exemplo | Contador |
| :--- | :--- | :--- | :--- |
| **Cliente / Estabelecimento** | `{SIGLA}-{SEQ:3}` | `HFI-001` | Por sigla (dois hotéis com a mesma sigla viram `-001` e `-002`) |
| **Demanda** | `{PREFIXO}-{SEQ:4}` | `DEM-0042` | Global da instância |

- O **prefixo de demanda** é fixo por instância (padrão `DEM`, editável pelo administrador).
- **Prefixo reservado:** nenhuma sigla de cliente pode ser igual ao prefixo de demanda (validação na criação).

### 2.1 Máscaras disponíveis (Configurações da Instância)
- `{SIGLA}-{SEQ:3}` → `HFI-001`
- `{SIGLA}{ALEATORIO:4}` → `HFI3022`
- `{SEQ}` → `1048`
- `{PREFIXO}-{SEQ:4}` → `DEM-0042`

---

## 3. Geração da Sigla do Cliente

1. O sistema **sugere** a sigla a partir das iniciais do nome fantasia, ignorando palavras genéricas configuráveis (`Hotel`, `Pousada`, `Resort`, `de`, `do`, `dos`, `da`, `das`, `e`).
   - *Senhor dos Trilhos* → `ST`; se a sugestão tiver menos de 3 letras, o analista completa (ex.: `SDT`).
2. Formato: 2 a 4 letras maiúsculas, sem acentos.
3. O analista pode **editar a sugestão antes de salvar**.
4. Após salvar, o `display_code` é **imutável**, porque ele já circula em mensagens, planilhas e tickets. Corrigir um código exige ação do administrador.

---

## 4. Garantia de Unicidade (Concorrência)

- Tabela `id_sequences (entity_type, scope, last_value)`: `scope` é a sigla (para clientes) ou `global` (para demandas).
- O incremento acontece dentro da mesma transação da criação, com bloqueio de linha (`SELECT … FOR UPDATE`). Duas criações simultâneas nunca recebem o mesmo número.
- Índice único `(instance_id, entity_type, display_code)` como segunda barreira.

---

## 5. Usabilidade do Código

- **Exibição:** ao lado do nome do cliente na ficha, nas abas e no breadcrumb. Nas linhas de tabela fica oculto para reduzir ruído.
- **Busca (`Ctrl+K`):** aceita o código com ou sem `#`, com ou sem zeros à esquerda (`hfi1` encontra `HFI-001`).
- **Cópia em 1 clique:** botão discreto ao lado do código copia `#HFI-001`.
