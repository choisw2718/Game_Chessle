import { Chess, type Move } from "chess.js";

export const STARTING_FEN = new Chess().fen();

export function moveToUci(move: Pick<Move, "from" | "to" | "promotion">) {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

/** Exact SAN is the Wordle token used by the default matching rule. */
export function sanIdentity(san: string) {
  return san.trim();
}

/**
 * Move legality is verified with UCI replay, but Wordle matching compares the
 * resulting SAN token exactly. Thus Nxe5/Ne5, Qh5+/Qh5 and Nf3/Ngf3 differ,
 * while the same e5 notation counts as the same token regardless of color.
 */
export function moveIdentityKey(
  move: Pick<Move, "color" | "from" | "to" | "promotion" | "san">,
) {
  return sanIdentity(move.san);
}

export function replayUci(moves: readonly string[]) {
  const chess = new Chess();
  const san: string[] = [];
  const comparisonKeys: string[] = [];

  for (const uci of moves) {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.slice(4, 5) || undefined;
    const move = chess.move({ from, to, promotion });
    if (!move) throw new Error(`Illegal UCI move: ${uci}`);
    san.push(move.san);
    comparisonKeys.push(moveIdentityKey(move));
  }

  return { chess, san, comparisonKeys, fen: chess.fen() };
}

export function pgnLineToMoves(pgn: string) {
  const chess = new Chess();
  chess.loadPgn(pgn.trim());
  const history = chess.history({ verbose: true });
  return {
    movesUci: history.map(moveToUci),
    movesSan: history.map((move) => move.san),
    fen: chess.fen(),
  };
}
