import { useState } from "react";
import type { FormEvent } from "react";

import type { Match } from "../api/matches";
import { TeamBadge } from "./TeamBadge";

type MatchCardProps = {
  match: Match;
  isSelected: boolean;
  isBusy: boolean;
  onGeneratePrediction: (matchId: string) => Promise<void>;
  onOpenReport: (matchId: string) => Promise<void>;
  onSubmitResult: (matchId: string, homeGoals: number, awayGoals: number) => Promise<void>;
};

export function MatchCard({
  match,
  isSelected,
  isBusy,
  onGeneratePrediction,
  onOpenReport,
  onSubmitResult
}: MatchCardProps) {
  const [homeGoals, setHomeGoals] = useState("");
  const [awayGoals, setAwayGoals] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmitResult(match.id, Number(homeGoals), Number(awayGoals));
    setHomeGoals("");
    setAwayGoals("");
  };

  return (
    <article
      className={`rounded-md border bg-white p-4 shadow-sm ${
        isSelected ? "border-emerald-500" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {match.competitionRef?.name ?? match.competition}
            {match.season ? ` · ${match.season.name}` : ""}
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-950">
            <TeamBadge name={match.homeTeam.name} /> {match.homeTeam.name} x {match.awayTeam.name}{" "}
            <TeamBadge name={match.awayTeam.name} />
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {match.round ?? match.stage ?? "Etapa nao definida"} · {new Date(match.startsAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {match.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isBusy}
          onClick={() => onGeneratePrediction(match.id)}
          type="button"
        >
          Gerar previsao
        </button>
        <button
          className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
          disabled={isBusy}
          onClick={() => onOpenReport(match.id)}
          type="button"
        >
          Abrir relatorio
        </button>
      </div>

      <form className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2" onSubmit={handleSubmit}>
        <input
          className="min-w-0 rounded border border-slate-300 px-3 py-2 text-sm"
          min={0}
          onChange={(event) => setHomeGoals(event.target.value)}
          placeholder="Mandante"
          required
          type="number"
          value={homeGoals}
        />
        <input
          className="min-w-0 rounded border border-slate-300 px-3 py-2 text-sm"
          min={0}
          onChange={(event) => setAwayGoals(event.target.value)}
          placeholder="Visitante"
          required
          type="number"
          value={awayGoals}
        />
        <button
          className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          Salvar
        </button>
      </form>
    </article>
  );
}
