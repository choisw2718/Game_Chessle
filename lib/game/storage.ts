import type { PublicProblem, RevealedProblem, TileStatus } from "@/lib/types";

const ACTIVE_KEY = "chessle-expert:active:v1";
const HISTORY_KEY = "chessle-expert:history:v1";

export interface StoredGuess {
  movesUci: string[];
  movesSan: string[];
  statuses: TileStatus[];
}

export interface ActiveGame {
  playId: string;
  problem: PublicProblem;
  guesses: StoredGuess[];
  currentUci: string[];
  currentSan: string[];
  status: "playing" | "won" | "lost";
  startedAt: string;
  completedAt: string | null;
  reveal: RevealedProblem | null;
}

export interface PlayRecord {
  playId: string;
  problemId: string;
  mode: PublicProblem["mode"];
  dateKey: string;
  outcome: "won" | "lost" | "abandoned";
  attempts: number;
  guesses: StoredGuess[];
  startedAt: string;
  completedAt: string;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadActiveGames() {
  return readJson<Partial<Record<PublicProblem["mode"], ActiveGame>>>(ACTIVE_KEY, {});
}

export function saveActiveGame(game: ActiveGame) {
  const games = loadActiveGames();
  games[game.problem.mode] = game;
  writeJson(ACTIVE_KEY, games);
}

export function clearActiveGame(mode: PublicProblem["mode"]) {
  const games = loadActiveGames();
  delete games[mode];
  writeJson(ACTIVE_KEY, games);
}

export function loadPlayHistory() {
  return readJson<PlayRecord[]>(HISTORY_KEY, []);
}

export function appendPlayRecord(record: PlayRecord) {
  const history = loadPlayHistory();
  if (!history.some((item) => item.playId === record.playId)) {
    history.unshift(record);
    writeJson(HISTORY_KEY, history.slice(0, 500));
  }
}

export function summarizeHistory(history = loadPlayHistory()) {
  const completed = history.filter((record) => record.outcome !== "abandoned");
  const wonRecords = completed.filter((record) => record.outcome === "won");
  const wins = wonRecords.length;
  const chronological = [...completed].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  let streak = 0;
  let bestStreak = 0;
  for (const record of chronological) {
    streak = record.outcome === "won" ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }
  return {
    played: completed.length,
    wins,
    winRate: completed.length ? Math.round((wins / completed.length) * 100) : 0,
    averageAttempts: wins
      ? Math.round((wonRecords.reduce((sum, record) => sum + record.attempts, 0) / wins) * 10) / 10
      : null,
    currentStreak: streak,
    bestStreak,
    abandoned: history.filter((record) => record.outcome === "abandoned").length,
  };
}
