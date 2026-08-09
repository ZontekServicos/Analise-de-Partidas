# Auditoria técnica — football-data.org v4

Data: 2026-08-08

## Resumo executivo

A integração ficou consistente para sincronização inicial após aplicação da migration. O client usa `X-Auth-Token` apenas no backend, timeout de 10 s, nenhum retry automático, erros específicos para 401/403/429 e parsing defensivo de quota. Nenhum segredo ou domínio da API externa foi encontrado no código/bundle do frontend. O Probability Engine v2 não foi alterado e não possui dependência da integração.

A validação operacional do PostgreSQL local ficou pendente: `prisma migrate status` não conectou ao banco configurado em `localhost:5432`. O schema foi validado e o client foi gerado, mas a primeira sincronização real só deve ocorrer depois de `prisma migrate deploy` concluir no ambiente alvo.

## Achados e correções

### Crítico

| ID | Problema | Severidade | Arquivo | Correção | Status |
|---|---|---|---|---|---|
| FD-001 | A suíte executava um request real sempre que a chave local existia. | Crítico | `apps/server/src/integrations/footballData/footballData.client.test.ts:175` | Smoke real passou a exigir `RUN_FOOTBALL_DATA_SMOKE_TEST=true`; a suíte normal é 100% mockada. | Corrigido |
| FD-002 | Resultado salvo antes de avaliar previsões podia deixar previsões pendentes para sempre após queda do processo; o sync idêntico retornava cedo. | Crítico | `apps/server/src/integrations/footballData/footballData.service.ts:157` | Sync repetido avalia somente previsões ainda não avaliadas; as já avaliadas não têm `evaluatedAt/errorScore` regravados. | Corrigido |

### Importante

| ID | Problema | Severidade | Arquivo | Correção | Status |
|---|---|---|---|---|---|
| FD-003 | Não havia migration versionada para IDs externos, provider, crest e constraints. | Importante | `apps/server/prisma/migrations/20260808190000_add_football_data_integration/migration.sql:1` | Migration aditiva, colunas nullable, índices compostos por provider+ID e remoção das unicidades inadequadas de nome/ID sem provider. | Corrigido; aplicação pendente no banco alvo |
| FD-004 | Payload resumido de partida podia apagar tipo/país da competição e country/founded/crest do time. | Importante | `apps/server/src/integrations/footballData/footballData.service.ts:80` | Updates agora só alteram campos opcionais quando eles vieram no payload. | Corrigido |
| FD-005 | Times eram inferidos como clube/seleção pela competição, inclusive sem evidência. | Importante | `apps/server/src/integrations/footballData/footballData.mapper.ts:96` | Adicionado `TeamType.UNKNOWN`; somente `type` explícito do provider classifica o time. | Corrigido |
| FD-006 | Headers numéricos inválidos geravam `NaN`, inclusive `Retry-After`. | Importante | `apps/server/src/integrations/footballData/footballData.client.ts:14` | Parsing aceita apenas números finitos não negativos; ausente/inválido vira `null/undefined`. | Corrigido |
| FD-007 | Resultado com placar igual e pênaltis alterados era considerado inalterado. | Importante | `apps/server/src/integrations/footballData/footballData.service.ts:43` | Comparação idempotente inclui gols em pênaltis. | Corrigido |
| FD-008 | Frontend usava rotas legadas enquanto `/api` era a convenção canônica; backend mantinha aliases duplicados. | Importante | `apps/server/src/app.ts:47`, `apps/web/src/api/teams.ts:24` | Todos os clients usam `/api/...`; aliases legados removidos. | Corrigido |
| FD-009 | Respostas 200 com listas ausentes tinham cast TypeScript sem validação de forma. | Importante | `apps/server/src/integrations/footballData/footballData.service.ts:30` | Listas top-level são validadas antes de iterar; mappers validam IDs, textos e datas obrigatórios. | Corrigido |

### Melhoria futura

| ID | Problema | Severidade | Arquivo | Correção | Status |
|---|---|---|---|---|---|
| FD-010 | `prisma migrate status` não pôde confirmar o estado real do PostgreSQL local. | Melhoria futura | `apps/server/prisma/schema.prisma` | Subir/conectar o banco e executar `npx prisma migrate deploy` antes do sync real. | Pendente operacional |
| FD-011 | Registros manuais sem provider não são reconciliados por nome com itens externos. | Melhoria futura | `README.md:76` | Manter reconciliação explícita futura; não usar nome como identidade automática. | Aceito/documentado |
| FD-012 | Configuração Prisma via `package.json#prisma` está deprecada para Prisma 7. | Melhoria futura | `apps/server/package.json` | Migrar futuramente para `prisma.config.ts`, sem relação com o sync v4 atual. | Pendente |

## Segurança

- Variáveis da integração aparecem somente no backend e em documentação/placeholders: `FOOTBALL_DATA_API_KEY`, `FOOTBALL_DATA_BASE_URL`, `DATA_SYNC_SECRET`.
- `.env` do servidor e do frontend estão ignorados pelo Git. Nenhuma chave real foi encontrada em arquivos versionados, código, README ou bundle Vite.
- O frontend contém somente `VITE_API_URL` e não chama `api.football-data.org`.
- O endpoint de status lê cache em memória e não faz chamada externa nem retorna chave/secret.
- As quatro rotas de sync exigem `X-Data-Sync-Secret`, falham fechadas quando não configuradas e rejeitam header ausente/incorreto.
- O backend desabilita `X-Powered-By`, usa Helmet, CORS configurado, limite JSON de 100 KB, 404 e handler de erro sem stack/secret na resposta.

## Prisma e idempotência

- `Competition`, `Season`, `Team` e `Match`: unique composto em `(externalProvider, externalId)`.
- `MatchResult`: `matchId` único, impedindo resultado duplicado.
- Nome de time deixou de ser identidade global; equipes homônimas de providers/contextos distintos não colidem.
- Sync mockado: competição 1ª execução cria e 2ª atualiza; partida `SCHEDULED -> FINISHED -> FINISHED` cria um único resultado e avalia a prediction uma única vez.
- `resultSource` persistido: `football-data.org`.

## TeamStats e Probability Engine

- Agregação consulta somente `Match` finalizada + `MatchResult` no PostgreSQL e calcula casa/fora, totais e janela recente.
- Não agrega nem inventa xG, shots, injuries ou big chances.
- Busca estática não encontrou import, fetch ou axios da football-data nos módulos de prediction/Probability Engine.
- Os 10 testes existentes do serviço v2 passaram; nenhum arquivo em `modules/probabilityEngine` foi alterado.

## Execuções

| Comando | Resultado |
|---|---|
| `npm install` | OK, dependências já atualizadas |
| `npm run test:server` | OK: 74 testes, 73 pass, 1 smoke real skipped por opt-in |
| `npm run build:server` | OK |
| `npm run build:web` | OK |
| `npm run build` | OK |
| `cd apps/server && npx prisma generate` | OK |
| `cd apps/server && npx prisma validate` | OK |
| `cd apps/server && npx prisma migrate status` | Falhou: PostgreSQL local configurado indisponível |
| Smoke real `GET /competitions` | Não concluído: tentativa inicial falhou por indisponibilidade de rede; nenhuma repetição para preservar quota |

## Railway readiness

Somente no serviço backend:

```env
FOOTBALL_DATA_API_KEY=
FOOTBALL_DATA_BASE_URL=https://api.football-data.org/v4
DATA_SYNC_SECRET=
```

Essas variáveis não pertencem ao serviço frontend. Antes da primeira sincronização, executar a migration no banco Railway e preencher secrets fortes. Não executar sync se `prisma migrate deploy` falhar.
