const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? "https://sopillcxiwpdhiqwmbph.supabase.co"
).replace(/\/+$/, "");

// Supabase publishable keys are intended for browser clients. Database access is
// still limited by the project's RLS policies and granted RPC functions.
const SUPABASE_PUBLISHABLE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? "sb_publishable_EMGftdsZx4L9j8Bibe3VHA_f98uIRrS"
);

const ANALYTICS_VISITOR_STORAGE_KEY = "chessle.analytics.visitor.v1";

interface ClientStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface CompletedGameResult {
  problemId: string;
  mode: "daily" | "random";
  dateKey: string;
  outcome: "won" | "lost";
  attempts: number;
}

export interface ProblemPeerStats {
  completedPlayers: number;
  solvedPlayers: number;
  solveRate: number;
  averageAttempts: number | null;
}

function createVisitorId() {
  const cryptoApi = typeof globalThis.crypto === "undefined" ? null : globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  if (cryptoApi) {
    const bytes = new Uint8Array(18);
    cryptoApi.getRandomValues(bytes);
    return `anon_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2).padEnd(20, "0")}`;
}

function isValidVisitorId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{20,64}$/.test(value);
}

export function loadAnalyticsVisitorId(storage?: ClientStorage) {
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!target) return createVisitorId();

  try {
    const stored = target.getItem(ANALYTICS_VISITOR_STORAGE_KEY);
    if (isValidVisitorId(stored)) return stored;
    const created = createVisitorId();
    target.setItem(ANALYTICS_VISITOR_STORAGE_KEY, created);
    return created;
  } catch {
    return createVisitorId();
  }
}

function asCount(value: unknown) {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
}

function roundToOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function problemPeerStatsFromSummary(
  payload: unknown,
  ownResult: CompletedGameResult,
): ProblemPeerStats | null {
  let value = Array.isArray(payload) ? payload[0] : payload;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;

  const summary = value as { dailyProblem?: unknown; randomProblems?: unknown };
  const aggregate = ownResult.mode === "daily"
    ? summary.dailyProblem
    : Array.isArray(summary.randomProblems)
      ? summary.randomProblems.find((item) => (
          item
          && typeof item === "object"
          && (item as Record<string, unknown>).problemId === ownResult.problemId
        ))
      : null;
  if (!aggregate || typeof aggregate !== "object") return null;
  const source = aggregate as Record<string, unknown>;
  if (source.problemId !== ownResult.problemId) return null;
  if (ownResult.mode === "daily" && source.dateKey !== ownResult.dateKey) return null;

  const completedUsers = asCount(source.completedUsers);
  const solvedUsers = Math.min(completedUsers, asCount(source.solvedUsers));
  const completedPlayers = Math.max(0, completedUsers - 1);
  const solvedPlayers = Math.max(0, solvedUsers - (ownResult.outcome === "won" ? 1 : 0));
  const aggregateAverage = Number(source.averageAttempts);
  const hasAggregateAverage = source.averageAttempts !== null
    && source.averageAttempts !== undefined
    && Number.isFinite(aggregateAverage);
  const aggregateAttempts = hasAggregateAverage
    ? aggregateAverage * solvedUsers
    : 0;
  const ownAttempts = ownResult.outcome === "won" ? ownResult.attempts : 0;
  const averageAttempts = solvedPlayers > 0 && hasAggregateAverage
    ? Math.min(6, Math.max(1, roundToOne((aggregateAttempts - ownAttempts) / solvedPlayers)))
    : null;

  return {
    completedPlayers,
    solvedPlayers,
    solveRate: completedPlayers ? Math.round(solvedPlayers / completedPlayers * 100) : 0,
    averageAttempts,
  };
}

async function rpc(
  functionName: string,
  parameters: Record<string, unknown>,
  fetcher: FetchLike,
) {
  const response = await fetcher(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parameters),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Analytics request failed (${response.status}).`);
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) as unknown : null;
}

export async function recordGameResultAndLoadPeerStats(
  result: CompletedGameResult,
  fetcher: FetchLike = fetch,
): Promise<ProblemPeerStats | null> {
  const visitorId = loadAnalyticsVisitorId();
  await rpc("record_analytics_game_result", {
    p_visitor_id: visitorId,
    p_problem_id: result.problemId,
    p_mode: result.mode,
    p_date_key: result.dateKey,
    p_outcome: result.outcome,
    p_attempts: result.attempts,
  }, fetcher);

  const summary = await rpc("get_analytics_summary", {}, fetcher);
  return problemPeerStatsFromSummary(summary, result);
}
