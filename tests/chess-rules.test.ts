import assert from "node:assert/strict";
import test from "node:test";
import { Chess } from "chess.js";
import { moveToUci, pgnLineToMoves, replayUci } from "../lib/chess/notation";

test("replays normal moves and preserves SAN, UCI, and FEN consistency", () => {
  const parsed = pgnLineToMoves("1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6");
  assert.deepEqual(parsed.movesUci, ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "a7a6"]);
  const replayed = replayUci(parsed.movesUci);
  assert.deepEqual(replayed.san, parsed.movesSan);
  assert.equal(replayed.fen, "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6");
});

test("rejects a move that ignores check", () => {
  const chess = new Chess();
  for (const san of ["f3", "e5", "g4", "Qh4+"]) chess.move(san);
  assert.equal(chess.isCheck(), true);
  assert.throws(() => chess.move("a3"));
});

test("handles legal castling and its SAN/UCI representation", () => {
  const chess = new Chess();
  for (const san of ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"]) chess.move(san);
  const castle = chess.move("O-O");
  assert.equal(castle.san, "O-O");
  assert.equal(moveToUci(castle), "e1g1");
});

test("handles en passant", () => {
  const chess = new Chess();
  for (const san of ["e4", "a6", "e5", "d5"]) chess.move(san);
  const move = chess.move("exd6");
  assert.equal(moveToUci(move), "e5d6");
  assert.equal(chess.get("d5"), undefined);
  assert.equal(chess.get("d6")?.type, "p");
});

test("handles promotion and SAN generation", () => {
  const chess = new Chess("7k/P7/8/8/8/8/8/7K w - - 0 1");
  const move = chess.move({ from: "a7", to: "a8", promotion: "q" });
  assert.equal(moveToUci(move), "a7a8q");
  assert.match(move.san, /^a8=Q/);
});
