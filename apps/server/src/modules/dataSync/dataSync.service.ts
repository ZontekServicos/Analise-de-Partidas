import { footballDataService } from "../../integrations/footballData/footballData.service";
import type {
  SyncCompetitionMatchesInput,
  SyncCompetitionTeamsInput,
  SyncMatchesByDateRangeInput
} from "./dataSync.schema";

export const dataSyncService = {
  syncCompetitions() {
    return footballDataService.syncCompetitions();
  },

  syncCompetitionTeams(externalId: string, input: SyncCompetitionTeamsInput) {
    return footballDataService.syncCompetitionTeams(externalId, input.season);
  },

  syncCompetitionMatches(externalId: string, input: SyncCompetitionMatchesInput) {
    return footballDataService.syncCompetitionMatches(externalId, input);
  },

  syncMatchesByDateRange(input: SyncMatchesByDateRangeInput) {
    return footballDataService.syncMatchesByDateRange(input.dateFrom, input.dateTo, input.competitions);
  }
};
