import assert from "node:assert/strict";
import test from "node:test";
import {
  problemPeerStatsFromSummary,
  recordGameResultAndLoadPeerStats,
} from "../lib/analytics/client";

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
  const stats = problemPeerStatsFromSummary(summary(10, 7, 3.14), {
    problemId: "daily-42",
    mode: "daily",
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
  const stats = problemPeerStatsFromSummary(summary(10, 7, 3.14), {
    problemId: "daily-42",
    mode: "daily",
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
  const stats = problemPeerStatsFromSummary(summary(1, 1, 2), {
    problemId: "daily-42",
    mode: "daily",
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
  const stats = problemPeerStatsFromSummary(summary(3, 2, null), {
    problemId: "daily-42",
    mode: "daily",
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
  const stats = problemPeerStatsFromSummary(summary(10, 7, 3.14), {
    problemId: "daily-99",
    mode: "daily",
    dateKey: "2026-07-30",
    outcome: "won",
    attempts: 2,
  });

  assert.equal(stats, null);
});

test("reads community stats for the completed Random problem only", () => {
  const stats = problemPeerStatsFromSummary({
    randomProblems: [
      {
        problemId: "random-other",
        completedUsers: 20,
        solvedUsers: 18,
        averageAttempts: 2,
      },
      {
        problemId: "random-42",
        completedUsers: 5,
        solvedUsers: 3,
        averageAttempts: 2.67,
      },
    ],
  }, {
    problemId: "random-42",
    mode: "random",
    dateKey: "2026-07-30",
    outcome: "won",
    attempts: 2,
  });

  assert.deepEqual(stats, {
    completedPlayers: 4,
    solvedPlayers: 2,
    solveRate: 50,
    averageAttempts: 3,
  });
});

test("records Random results with the problem mode before loading its stats", async () => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({
      url: input.toString(),
      body: JSON.parse(init?.body as string) as Record<string, unknown>,
    });
    if (requests.length === 1) return new Response(null, { status: 204 });
    return new Response(JSON.stringify({
      randomProblems: [{
        problemId: "random-42",
        completedUsers: 2,
        solvedUsers: 1,
        averageAttempts: 4,
      }],
    }), { status: 200 });
  };

  const stats = await recordGameResultAndLoadPeerStats({
    problemId: "random-42",
    mode: "random",
    dateKey: "2026-07-30",
    outcome: "won",
    attempts: 4,
  }, fetcher);

  assert.equal(requests[0].url.endsWith("/record_analytics_game_result"), true);
  assert.equal(requests[0].body.p_mode, "random");
  assert.equal(requests[0].body.p_problem_id, "random-42");
  assert.equal(requests[1].url.endsWith("/get_analytics_summary"), true);
  assert.deepEqual(stats, {
    completedPlayers: 1,
    solvedPlayers: 0,
    solveRate: 0,
    averageAttempts: null,
  });
});
