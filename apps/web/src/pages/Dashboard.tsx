import { useEffect, useState } from "react";
import axios from "axios";

import type { Competition } from "../api/competitions";
import { listCompetitions } from "../api/competitions";
import type { Match } from "../api/matches";
import { listMatches } from "../api/matches";
import type { CalibrationRun } from "../api/modelCalibration";
import { runModelCalibration } from "../api/modelCalibration";
import { generatePrediction } from "../api/predictions";
import { createResult } from "../api/results";
import type { MatchReport as MatchReportType, ModelPerformance as ModelPerformanceType } from "../api/reports";
import { getMatchReport, getModelPerformance } from "../api/reports";
import type { Season } from "../api/seasons";
import { listSeasons } from "../api/seasons";
import type { Team, TeamType } from "../api/teams";
import { listTeams } from "../api/teams";
import { MatchCard } from "../components/MatchCard";
import { MatchReport } from "../components/MatchReport";
import { ModelPerformance } from "../components/ModelPerformance";

const MATCH_STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "SCHEDULED", label: "Agendada" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "FINISHED", label: "Finalizada" },
  { value: "CANCELLED", label: "Cancelada" }
];

const TEAM_TYPE_OPTIONS: Array<{ value: "" | TeamType; label: string }> = [
  { value: "", label: "Selecoes e clubes" },
  { value: "NATIONAL_TEAM", label: "Selecoes" },
  { value: "CLUB", label: "Clubes" }
];

export function Dashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchReport, setMatchReport] = useState<MatchReportType | null>(null);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformanceType | null>(null);
  const [calibration, setCalibration] = useState<CalibrationRun | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [competitionId, setCompetitionId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [teamType, setTeamType] = useState<"" | TeamType>("");
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState("");

  const loadMatches = async () => {
    const data = await listMatches({
      competitionId: competitionId || undefined,
      seasonId: seasonId || undefined,
      teamId: teamId || undefined,
      status: status || undefined
    });
    setMatches(data);
  };

  const loadPerformance = async () => {
    const data = await getModelPerformance();
    setModelPerformance(data);
  };

  const showError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      setMessage(error.response?.data?.message ?? error.message);
      return;
    }

    setMessage("Erro inesperado ao executar acao.");
  };

  const runAction = async (action: () => Promise<void>) => {
    setIsBusy(true);
    setMessage(null);

    try {
      await action();
    } catch (error) {
      showError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleGeneratePrediction = async (matchId: string) => {
    await runAction(async () => {
      await generatePrediction(matchId);
      const report = await getMatchReport(matchId);
      setSelectedMatchId(matchId);
      setMatchReport(report);
      setMessage("Previsao gerada com sucesso.");
    });
  };

  const handleOpenReport = async (matchId: string) => {
    await runAction(async () => {
      const report = await getMatchReport(matchId);
      setSelectedMatchId(matchId);
      setMatchReport(report);
    });
  };

  const handleSubmitResult = async (matchId: string, homeGoals: number, awayGoals: number) => {
    await runAction(async () => {
      await createResult({
        matchId,
        homeGoals,
        awayGoals,
        resultSource: "frontend-mvp"
      });
      const [report] = await Promise.all([getMatchReport(matchId), loadPerformance(), loadMatches()]);
      setSelectedMatchId(matchId);
      setMatchReport(report);
      setMessage("Resultado registrado com sucesso.");
    });
  };

  const handleRefreshPerformance = async () => {
    await runAction(loadPerformance);
  };

  const handleRunCalibration = async () => {
    await runAction(async () => {
      const data = await runModelCalibration();
      setCalibration(data);
      setMessage("Calibracao executada com sucesso.");
    });
  };

  const handleCompetitionChange = (value: string) => {
    setCompetitionId(value);
    setSeasonId("");
  };

  const handleTeamTypeChange = (value: "" | TeamType) => {
    setTeamType(value);
    setTeamId("");
  };

  useEffect(() => {
    runAction(async () => {
      const [competitionsData] = await Promise.all([listCompetitions(), loadPerformance()]);
      setCompetitions(competitionsData);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!competitionId) {
      setSeasons([]);
      return;
    }

    listSeasons({ competitionId }).then(setSeasons).catch(showError);
  }, [competitionId]);

  useEffect(() => {
    listTeams({ teamType: teamType || undefined }).then(setTeams).catch(showError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamType]);

  useEffect(() => {
    runAction(loadMatches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId, seasonId, teamId, status]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section>
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-slate-950">Football Prediction Lab</h1>
            <p className="mt-1 text-sm text-slate-600">
              Previsoes, resultados, relatorios e calibracao para competicoes de selecoes e clubes.
            </p>
          </div>

          <div className="mb-5 grid gap-2 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
            <select
              className="rounded border border-slate-300 px-2 py-2 text-sm"
              onChange={(event) => handleCompetitionChange(event.target.value)}
              value={competitionId}
            >
              <option value="">Todas as competicoes</option>
              {competitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name}
                </option>
              ))}
            </select>

            <select
              className="rounded border border-slate-300 px-2 py-2 text-sm"
              disabled={!competitionId}
              onChange={(event) => setSeasonId(event.target.value)}
              value={seasonId}
            >
              <option value="">Todas as temporadas</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>

            <select
              className="rounded border border-slate-300 px-2 py-2 text-sm"
              onChange={(event) => handleTeamTypeChange(event.target.value as "" | TeamType)}
              value={teamType}
            >
              {TEAM_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="rounded border border-slate-300 px-2 py-2 text-sm"
              onChange={(event) => setTeamId(event.target.value)}
              value={teamId}
            >
              <option value="">Todos os times</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

            <select
              className="rounded border border-slate-300 px-2 py-2 text-sm"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              {MATCH_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {message ? (
            <div className="mb-4 rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
              {message}
            </div>
          ) : null}

          <div className="grid gap-4">
            {matches.length === 0 ? (
              <p className="text-sm text-slate-600">Nenhuma partida encontrada para os filtros selecionados.</p>
            ) : (
              matches.map((match) => (
                <MatchCard
                  isBusy={isBusy}
                  isSelected={match.id === selectedMatchId}
                  key={match.id}
                  match={match}
                  onGeneratePrediction={handleGeneratePrediction}
                  onOpenReport={handleOpenReport}
                  onSubmitResult={handleSubmitResult}
                />
              ))
            )}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <ModelPerformance
            calibration={calibration}
            isBusy={isBusy}
            onRefresh={handleRefreshPerformance}
            onRunCalibration={handleRunCalibration}
            performance={modelPerformance}
          />
          <MatchReport report={matchReport} />
        </aside>
      </div>
    </main>
  );
}
