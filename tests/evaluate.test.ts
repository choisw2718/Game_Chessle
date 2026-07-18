import assert from "node:assert/strict";
import test from "node:test";
import { evaluateGuess } from "../lib/chess/evaluate";

test("marks a fully matching line as correct", () => {
  const answer = ["a", "b", "c", "d"];
  assert.deepEqual(evaluateGuess(answer, answer), {
    statuses: ["correct", "correct", "correct", "correct"],
    solved: true,
  });
});

test("marks a fully unrelated line as absent", () => {
  assert.deepEqual(evaluateGuess(["a", "b"], ["x", "y"]).statuses, ["absent", "absent"]);
});

test("marks a move in the wrong position as present", () => {
  assert.deepEqual(evaluateGuess(["a", "b", "c"], ["c", "a", "b"]).statuses, ["present", "present", "present"]);
});

test("limits duplicate present matches to the answer count", () => {
  assert.deepEqual(evaluateGuess(["a", "b", "c"], ["b", "x", "b"]).statuses, ["present", "absent", "absent"]);
});

test("accounts for multiple duplicates after reserving green tiles", () => {
  assert.deepEqual(
    evaluateGuess(["a", "b", "a", "c", "d"], ["a", "a", "x", "a", "d"]).statuses,
    ["correct", "present", "absent", "absent", "correct"],
  );
});

test("rejects lines with different lengths", () => {
  assert.throws(() => evaluateGuess(["a"], ["a", "b"]), /same number of plies/);
});
