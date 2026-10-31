# Painel de Operação (white-label)

Painel interno para a operação de gestão hoteleira. O planejamento completo está em [`planning/`](planning/README.md) e as regras de trabalho em [`CLAUDE.md`](CLAUDE.md).

## Como rodar no seu computador

Pré-requisitos: Node.js 24 e PostgreSQL 18 instalados, e o arquivo `.env.local` criado (`npm run gerar-chaves`, depois cole a senha do banco).

```bash
npm install
```

```bash
npx prisma migrate deploy
```

```bash
npm run dev
```

O sistema abre em http://localhost:3000.

### Primeiro Administrador

```bash
npm run semente -- --instancia "Nome da plataforma" --nome "Seu nome" --usuario seu.usuario --email voce@empresa.com
```

A senha temporária aparece só no terminal e vale 48 horas. No primeiro acesso o sistema pede uma senha nova e o Google Authenticator.

## Testes

```bash
npm test
```

```bash
npm run test:e2e
```

Os testes usam um banco separado (`support_system_test`) e uma pasta de compilação própria, então podem rodar com o sistema ligado.

## Telas de desenvolvimento

- `/dev/componentes`: catálogo de componentes nos dois temas.
- `/dev/tempo-real`: teste de tempo real e trava de edição (abra em dois navegadores).

Essas telas não existem em produção.
