import type { CalibrationRun } from "../api/modelCalibration";
import type { ModelPerformance as ModelPerformanceType } from "../api/reports";

type ModelPerformanceProps = {
  performance: ModelPerformanceType | null;
  calibration: CalibrationRun | null;
  isBusy: boolean;
  onRefresh: () => Promise<void>;
  onRunCalibration: () => Promise<void>;
};

const asPercent = (value: number) => `${Math.round(value * 100)}%`;

export function ModelPerformance({
  performance,
  calibration,
  isBusy,
  onRefresh,
  onRunCalibration
}: ModelPerformanceProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-950">Performance do modelo</h2>
        <button
          className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
          disabled={isBusy}
          onClick={onRefresh}
          type="button"
        >
          Atualizar
        </button>
      </div>

      {performance ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric label="Previsoes" value={String(performance.totalPredictions)} />
          <Metric label="Avaliadas" value={String(performance.evaluatedPredictions)} />
          <Metric label="Acerto vencedor" value={asPercent(performance.winnerHitRate)} />
          <Metric label="Erro total medio" value={String(performance.averageTotalGoalsError)} />
          <Metric label="Confianca media" value={asPercent(performance.averageConfidence)} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">Sem dados carregados.</p>
      )}

      <button
        className="mt-5 w-full rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        disabled={isBusy}
        onClick={onRunCalibration}
        type="button"
      >
        Executar calibracao
      </button>

      {calibration ? (
        <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
          <p className="font-semibold">Calibracao criada: {calibration.id}</p>
          <p className="mt-1">Status: {calibration.status}</p>
          <p>Previsoes avaliadas: {calibration.matchesEvaluated}</p>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
