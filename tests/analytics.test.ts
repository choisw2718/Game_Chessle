import assert from "node:assert/strict";
import test from "node:test";
import { dailyPeerStatsFromSummary } from "../lib/analytics/client";

function summary(
  completedUsers: number,
  solvedUsers: number,
  averageAttempts: number | null,
) {
  return {
    dailyProblem: {
      problemId: "daily-42",
      dateKey: "2026-07-30",
      completedUsers,
      solvedUsers,
      averageAttempts,
    },
  };
}

test("excludes the current winner from Daily community stats", () => {
  const stats = dailyPeerStatsFromSummary(summary(10, 7, 3.14), {
    problemId: "daily-42",
    dateKey: "2026-07-30",
    outcome: "won",
    attempts: 2,
  });

  assert.deepEqual(stats, {
    completedPlayers: 9,
    solvedPlayers: 6,
    solveRate: 67,
    averageAttempts: 3.3,
  });
});

test("keeps solver totals unchanged when the current player lost", () => {
  const stats = dailyPeerStatsFromSummary(summary(10, 7, 3.14), {
    problemId: "daily-42",
    dateKey: "2026-07-30",
    outcome: "lost",
    attempts: 6,
  });

  assert.deepEqual(stats, {
    completedPlayers: 9,
    solvedPlayers: 7,
    solveRate: 78,
    averageAttempts: 3.1,
  });
});

test("reports an empty peer sample for the first completed player", () => {
  const stats = dailyPeerStatsFromSummary(summary(1, 1, 2), {
    problemId: "daily-42",
    dateKey: "2026-07-30",
    outcome: "won",
    attempts: 2,
  });

  assert.deepEqual(stats, {
    completedPlayers: 0,
    solvedPlayers: 0,
    solveRate: 0,
    averageAttempts: null,
  });
});

test("does not invent an average when the aggregate has no solved average", () => {
  const stats = dailyPeerStatsFromSummary(summary(3, 2, null), {
    problemId: "daily-42",
    dateKey: "2026-07-30",
    outcome: "lost",
    attempts: 6,
  });

  assert.deepEqual(stats, {
    completedPlayers: 2,
    solvedPlayers: 2,
    solveRate: 100,
    averageAttempts: null,
  });
});

test("ignores a summary for a different Daily problem", () => {
  const stats = dailyPeerStatsFromSummary(summary(10, 7, 3.14), {
    problemId: "daily-99",
    dateKey: "2026-07-30",
    outcome: "won",
    attempts: 2,
  });

  assert.equal(stats, null);
});
