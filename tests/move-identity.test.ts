import assert from "node:assert/strict";
import test from "node:test";
import { evaluateGuess } from "../lib/chess/evaluate";
import { replayUci } from "../lib/chess/notation";

function lastIdentity(moves: string[]) {
  return replayUci(moves).comparisonKeys.at(-1)!;
}

test("matches the same d4 SAN played by white and black", () => {
  const whiteD4 = lastIdentity(["d2d4"]);
  const blackD4 = lastIdentity(["g1f3", "d7d5", "c2c4", "d5d4"]);

  assert.equal(whiteD4, "d4");
  assert.equal(blackD4, "d4");
  assert.deepEqual(evaluateGuess([whiteD4], [blackD4]).statuses, ["correct"]);
});

test("matches identical capture SAN from different colors and origins", () => {
  const blackExd4 = lastIdentity(["d2d4", "e7e5", "g1f3", "e5d4"]);
  const whiteExd4 = lastIdentity(["e2e3", "d7d5", "g1f3", "d5d4", "e3d4"]);

  assert.equal(blackExd4, "exd4");
  assert.equal(whiteExd4, "exd4");
  assert.equal(blackExd4, whiteExd4);
});

test("distinguishes Nf3 from Ngf3 even when the UCI move is g1f3", () => {
  const plainNf3 = lastIdentity(["g1f3"]);
  const disambiguatedNgf3 = lastIdentity([
    "b1a3", "a7a6",
    "a3b5", "a6a5",
    "b5d4", "h7h6",
    "g1f3",
  ]);

  assert.equal(plainNf3, "Nf3");
  assert.equal(disambiguatedNgf3, "Ngf3");
  assert.deepEqual(evaluateGuess([plainNf3], [disambiguatedNgf3]).statuses, ["absent"]);
});

test("counts repeated identical chess moves with Wordle multiplicity", () => {
  const repeatedLine = replayUci([
    "g1f3", "a7a6",
    "f3g1", "a6a5",
    "g1f3",
  ]).comparisonKeys;
  const repeatedNf3 = repeatedLine[0];
  assert.equal(repeatedNf3, repeatedLine[4]);

  assert.deepEqual(
    evaluateGuess(
      [repeatedNf3, "other", repeatedNf3, "last"],
      [repeatedNf3, repeatedNf3, "missing", repeatedNf3],
    ).statuses,
    ["correct", "present", "absent", "absent"],
  );
});

test("distinguishes captures and exact check markers in SAN identity", () => {
  const capture = lastIdentity(["e2e4", "e7e5", "g1f3", "b8c6", "f3e5"]);
  const quiet = lastIdentity(["g1f3", "a7a6", "f3e5"]);
  const checkMove = lastIdentity(["e2e4", "f7f6", "d1h5"]);
  const quietQueenMove = lastIdentity(["e2e4", "e7e5", "d1h5"]);

  assert.equal(capture, "Nxe5");
  assert.equal(quiet, "Ne5");
  assert.deepEqual(evaluateGuess([capture], [quiet]).statuses, ["absent"]);
  assert.equal(checkMove, "Qh5+");
  assert.equal(quietQueenMove, "Qh5");
  assert.deepEqual(evaluateGuess([checkMove], [quietQueenMove]).statuses, ["absent"]);
});
