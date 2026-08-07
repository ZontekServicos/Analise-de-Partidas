import type { MatchReport as MatchReportType } from "../api/reports";

type MatchReportProps = {
  report: MatchReportType | null;
};

const asPercent = (value: number) => `${Math.round(value * 100)}%`;

const FACTOR_LABELS: Record<string, string> = {
  recentPerformance: "Forma recente",
  offensiveEfficiency: "Eficiencia ofensiva",
  defensiveSolidity: "Solidez defensiva",
  squadStrength: "Forca do elenco",
  physicalCondition: "Condicao fisica",
  competitiveExperience: "Experiencia competitiva",
  matchContext: "Contexto da partida",
  tacticalMatchup: "Encaixe tatico",
  worldRanking: "Ranking mundial",
  opponentStrength: "Forca dos adversarios",
  // Chaves do modelo v1, mantidas para previsoes antigas ja salvas
  recentFormScore: "Forma recente (v1)",
  attackStrength: "Forca ofensiva (v1)",
  defenseStrength: "Forca defensiva (v1)",
  injuryImpact: "Impacto de lesoes (v1)",
  lineupStrength: "Forca da escalacao (v1)",
  motivation: "Motivacao (v1)",
  matchImportance: "Importancia da partida (v1)",
  neutralField: "Campo neutro (v1)"
};

const factorLabel = (factorKey: string) => FACTOR_LABELS[factorKey] ?? factorKey;

export function MatchReport({ report }: MatchReportProps) {
  if (!report) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Relatorio da partida</h2>
        <p className="mt-2 text-sm text-slate-600">Selecione uma partida para carregar o relatorio.</p>
      </section>
    );
  }

  const prediction = report.latestPrediction;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            {report.match.homeTeam.name} x {report.match.awayTeam.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {report.match.competition} · {report.match.stage ?? "Etapa nao definida"}
          </p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {report.match.status}
        </span>
      </div>

      {prediction ? (
        <div className="mt-5 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Mandante" value={asPercent(prediction.homeWinProbability)} />
            <Metric label="Empate" value={asPercent(prediction.drawProbability)} />
            <Metric label="Visitante" value={asPercent(prediction.awayWinProbability)} />
          </div>

          <div className="rounded border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-950">Placar previsto</h3>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {prediction.predictedHomeGoals?.toFixed(2) ?? "-"} x{" "}
              {prediction.predictedAwayGoals?.toFixed(2) ?? "-"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Confianca: {prediction.confidenceScore ? asPercent(prediction.confidenceScore) : "-"}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-950">Fatores</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-2 pr-3">Fator</th>
                    <th className="py-2 pr-3">Valor</th>
                    <th className="py-2 pr-3">Normalizado</th>
                    <th className="py-2 pr-3">Peso</th>
                    <th className="py-2">Contribuicao</th>
                  </tr>
                </thead>
                <tbody>
                  {report.predictionFactors.map((factor) => (
                    <tr className="border-b border-slate-100" key={factor.id}>
                      <td className="py-2 pr-3 font-medium text-slate-800">{factorLabel(factor.factorKey)}</td>
                      <td className="py-2 pr-3">{factor.rawValue}</td>
                      <td className="py-2 pr-3">{factor.normalizedValue}</td>
                      <td className="py-2 pr-3">{factor.weight}</td>
                      <td className="py-2">{factor.contribution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-600">Nenhuma previsao gerada para esta partida.</p>
      )}

      {report.result ? (
        <div className="mt-5 rounded border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Resultado real</h3>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {report.result.homeGoals} x {report.result.awayGoals}
          </p>
          {report.comparison ? (
            <p className="mt-2 text-sm text-slate-600">
              Erro total: {report.comparison.totalGoalsError} · Probabilidade do resultado correto:{" "}
              {asPercent(report.comparison.probabilityAssignedToCorrectOutcome)}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
