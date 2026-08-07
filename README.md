# Football Prediction Lab

Monorepo (npm workspaces) para a plataforma de análise e previsão de partidas de futebol.

```text
apps/
├── server/   # Backend: Node.js + Express + TypeScript + Prisma + Zod (motor de previsao v2)
└── web/      # Frontend: React + Vite + TypeScript + Tailwind

packages/     # Reservado para bibliotecas compartilhadas futuras (ver abaixo)
docs/         # Documentação futura do projeto
```

## Uso rápido

```bash
npm install          # instala as dependências dos dois apps (workspaces)
npm run dev:server    # backend em modo dev (apps/server)
npm run dev:web       # frontend em modo dev (apps/web)
npm run build         # build:server + build:web
npm run test:server   # testes do backend (motor de previsão, etc.)
```

## Comandos individuais

### Backend (`apps/server`)

```bash
cd apps/server
cp .env.example .env      # preencha DATABASE_URL localmente
npm run dev
npx prisma generate
npx prisma migrate dev
npm run seed
npm test
npm run build
```

### Frontend (`apps/web`)

```bash
cd apps/web
cp .env.example .env      # preencha VITE_API_URL localmente
npm run dev
npm run build
```

## `packages/` (evolução futura)

Ainda vazio de propósito — nesta etapa só a estrutura de monorepo foi estabilizada. Candidatos a extrair para cá mais adiante, sem pressa:

- `packages/probability-engine` — motor de previsão v2, hoje em `apps/server/src/modules/probabilityEngine`
- `packages/shared-types` — tipos compartilhados entre backend e frontend (ex.: shape de `Prediction`, `TeamStats`)
- `packages/shared-utils` — utilitários genéricos reaproveitáveis pelos dois apps

## Deploy (Railway)

Crie dois serviços separados, ambos usando Railpack, com estas configurações:

### Backend

- Root Directory: `apps/server`
- Build Command: `npm run build`
- Start Command: `npm start`
- Variáveis: `DATABASE_URL`, `CORS_ORIGIN` e, opcionalmente, `NODE_ENV=production`
- Healthcheck recomendado: `/health`

O build TypeScript gera `dist/server.js`, que é executado diretamente pelo script
`start`. Se houver migrations versionadas, configure `npm run migrate:deploy` como
Pre-Deploy Command no Railway; migrations não fazem parte do processo principal.

### Frontend (Static SPA)

- Root Directory: `apps/web`
- Build Command: `npm run build`
- Variáveis: `VITE_API_URL` e `RAILPACK_SPA_OUTPUT_DIR=dist`

O Vite gera os arquivos estáticos em `dist`. `RAILPACK_SPA_OUTPUT_DIR=dist` força o
modo SPA do Railpack, que publica esse diretório e aplica fallback para `index.html`.
Não configure Start Command para o frontend estático.

Variáveis de ambiente de cada app ficam em `apps/server/.env.example` e `apps/web/.env.example` — configure os valores reais direto no painel do Railway, nunca em arquivo versionado.
