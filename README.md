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

Dois serviços separados, cada um com "Root Directory" apontando para o respectivo app:

- Backend: `apps/server`
- Frontend: `apps/web`

Variáveis de ambiente de cada app ficam em `apps/server/.env.example` e `apps/web/.env.example` — configure os valores reais direto no painel do Railway, nunca em arquivo versionado.
