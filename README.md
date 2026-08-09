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

## Integração football-data.org (fonte de dados)

A football-data.org é só uma **fonte de dados** — nunca substitui o Probability Engine v2, e o frontend nunca fala com ela diretamente:

```text
football-data.org → Integration Client → Mapper → Data Sync → PostgreSQL → Probability Engine v2 → Frontend
```

Variáveis (`apps/server/.env`, nunca no frontend): `FOOTBALL_DATA_API_KEY`, `FOOTBALL_DATA_BASE_URL`, `DATA_SYNC_SECRET`.

Fluxo manual recomendado (nenhum passo é automático, não há cron):

```bash
# 1. Sincronizar competições disponíveis
curl -X POST http://localhost:3000/api/data-sync/competitions -H "X-Data-Sync-Secret: $DATA_SYNC_SECRET"

# 2. Sincronizar os times de uma competição (externalId da football-data.org, ex.: 2021 = Premier League)
curl -X POST http://localhost:3000/api/data-sync/competitions/2021/teams -H "X-Data-Sync-Secret: $DATA_SYNC_SECRET"

# 3. Sincronizar as partidas dessa competição
curl -X POST http://localhost:3000/api/data-sync/competitions/2021/matches -H "X-Data-Sync-Secret: $DATA_SYNC_SECRET"

# 4. Ver quota/saúde da integração (não gasta chamada nova)
curl http://localhost:3000/api/integrations/football-data/status
```

Depois disso, o Dashboard já lista as competições/temporadas/times/partidas sincronizadas, e "Gerar previsão" funciona normalmente (o motor v2 só lê o nosso banco, nunca a API externa). `TeamStats` agregados a partir do histórico real (`teamStatsAggregation.service.ts`) ainda precisam ser aplicados via código/console nesta primeira versão — não há rota HTTP dedicada para isso ainda.

**Limitação conhecida**: times/competições cadastrados manualmente no seed (sem `externalId`) não são casados automaticamente com os registros sincronizados — o sync nunca usa nome como chave, então cria registros novos em vez de mesclar. Reconciliação retroativa fica para uma etapa futura.

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
- Variáveis: `DATABASE_URL`, `CORS_ORIGIN`, opcionalmente `NODE_ENV=production`, e — só se for usar a integração football-data.org — `FOOTBALL_DATA_API_KEY`, `FOOTBALL_DATA_BASE_URL`, `DATA_SYNC_SECRET` (essas três pertencem exclusivamente a este serviço, nunca ao frontend)
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
