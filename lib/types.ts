export type TileStatus = "correct" | "present" | "absent";

export interface ProblemSource {
  openingData: string;
  masterStatistics: string;
  generatedAt: string;
  openingDataFetchedAt: string;
  masterStatisticsFetchedAt: string | null;
  masterStatisticsSemantics:
    | "terminal-position-after-uci-prefix"
    | "unavailable";
  isExactSequenceCount: boolean;
}

export interface OpeningAlias {
  eco: string;
  name: string;
  sourcePlyCount: number;
}

export interface OpeningProblem {
  id: string;
  eco: string;
  openingName: string;
  variationName?: string;
  subvariationName?: string;
  fullName: string;
  openingFamily: string;
  movesUci: string[];
  movesSan: string[];
  terminalFen: string;
  plyCount: number;
  sourcePlyCount: number;
  exactMasterGames: number | null;
  hasDetailedName: boolean;
  eligibilityReasons: Array<"detailed-name" | "master-games-50-plus">;
  aliases: OpeningAlias[];
  duplicateSourceCount: number;
  transpositionGroupId: string | null;
  transpositionCount: number;
  alternativeMoveOrderIds: string[];
  diversityKey: string;
  qualityFlags: string[];
  source: ProblemSource;
  enabled: boolean;
}

export interface ProblemDataset {
  schemaVersion: 1;
  generatedAt: string;
  problemLength: 10;
  maxAttempts: 6;
  statisticsSemantics: string;
  problems: OpeningProblem[];
}

export interface PublicProblem {
  id: string;
  sequenceNumber: number;
  mode: "daily" | "random";
  dateKey: string;
  plyCount: number;
  maxAttempts: number;
}

export interface GuessResult {
  statuses: TileStatus[];
  solved: boolean;
}

export interface RevealedProblem {
  id: string;
  eco: string;
  openingName: string;
  variationName?: string;
  subvariationName?: string;
  fullName: string;
  movesSan: string[];
  movesUci: string[];
  terminalFen: string;
  exactMasterGames: number | null;
  eligibilityReasons: OpeningProblem["eligibilityReasons"];
  masterStatisticsSemantics: ProblemSource["masterStatisticsSemantics"];
}
