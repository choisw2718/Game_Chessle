import type { OpeningProblem } from "@/lib/types";

const EPOCH_UTC = Date.UTC(2026, 0, 1);

export function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function dailySequenceNumber(date = new Date()) {
  return Math.floor((Date.parse(`${dateKey(date)}T00:00:00.000Z`) - EPOCH_UTC) / 86_400_000) + 1;
}

export function selectDailyProblem(problems: readonly OpeningProblem[], date = new Date()) {
  if (!problems.length) throw new Error("No enabled opening problems are available.");
  const key = dateKey(date);
  const index = hashString(`chessle-expert:${key}`) % problems.length;
  return { problem: problems[index], sequenceNumber: dailySequenceNumber(date), dateKey: key };
}

export function selectRandomProblem(
  problems: readonly OpeningProblem[],
  excludedIds: ReadonlySet<string> = new Set(),
  random = Math.random,
) {
  if (!problems.length) throw new Error("No enabled opening problems are available.");
  const eligible = problems.filter((problem) => !excludedIds.has(problem.id));
  const pool = eligible.length ? eligible : [...problems];
  return pool[Math.floor(random() * pool.length)];
}
