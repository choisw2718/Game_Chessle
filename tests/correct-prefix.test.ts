import assert from "node:assert/strict";
import test from "node:test";
import { findLongestCorrectPrefix } from "../lib/game/correct-prefix";
import type { StoredGuess } from "../lib/game/storage";

function guess(statuses: StoredGuess["statuses"], label: string): StoredGuess {
  return {
    statuses,
    movesUci: statuses.map((_, index) => `${label}-uci-${index}`),
    movesSan: statuses.map((_, index) => `${label}-san-${index}`),
  };
}

test("returns the longest consecutive green prefix", () => {
  const result = findLongestCorrectPrefix([
    guess(["correct", "absent", "correct"], "short"),
    guess(["correct", "correct", "correct", "present"], "long"),
  ]);

  assert.deepEqual(result, {
    movesUci: ["long-uci-0", "long-uci-1", "long-uci-2"],
    movesSan: ["long-san-0", "long-san-1", "long-san-2"],
  });
});

test("does not reuse isolated green moves after the first non-green move", () => {
  const result = findLongestCorrectPrefix([
    guess(["absent", "correct", "correct"], "line"),
  ]);

  assert.equal(result, null);
});

test("prefers the most recent guess when green prefixes have the same length", () => {
  const result = findLongestCorrectPrefix([
    guess(["correct", "correct", "absent"], "old"),
    guess(["correct", "correct", "present"], "new"),
  ]);

  assert.deepEqual(result?.movesUci, ["new-uci-0", "new-uci-1"]);
});

test("ignores a corrupt status tail without matching move data", () => {
  const result = findLongestCorrectPrefix([{
    statuses: ["correct", "correct"],
    movesUci: ["e2e4"],
    movesSan: ["e4"],
  }]);

  assert.deepEqual(result, { movesUci: ["e2e4"], movesSan: ["e4"] });
});
