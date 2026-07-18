import assert from "node:assert/strict";
import test from "node:test";
import { summarizeHistory, type PlayRecord } from "../lib/game/storage";

function record(outcome: PlayRecord["outcome"], attempts: number, completedAt: string): PlayRecord {
  return {
    playId: `${outcome}-${completedAt}`,
    problemId: `problem-${completedAt}`,
    mode: "daily",
    dateKey: completedAt.slice(0, 10),
    outcome,
    attempts,
    guesses: [],
    startedAt: completedAt,
    completedAt,
  };
}

test("calculates average attempts from solved games only", () => {
  const stats = summarizeHistory([
    record("won", 2, "2026-01-01T00:00:00.000Z"),
    record("lost", 6, "2026-01-02T00:00:00.000Z"),
    record("won", 5, "2026-01-03T00:00:00.000Z"),
    record("abandoned", 1, "2026-01-04T00:00:00.000Z"),
  ]);

  assert.equal(stats.averageAttempts, 3.5);
});

test("returns no average before the first solved game", () => {
  const stats = summarizeHistory([
    record("lost", 6, "2026-01-01T00:00:00.000Z"),
    record("abandoned", 2, "2026-01-02T00:00:00.000Z"),
  ]);

  assert.equal(stats.averageAttempts, null);
});
