import type { StoredGuess } from "./storage";

export interface CorrectPrefix {
  movesUci: string[];
  movesSan: string[];
}

/**
 * Returns the longest legal prefix that a player has already confirmed green
 * in one completed guess. A single guess is used so the stored UCI moves stay
 * mutually legal when replayed from the initial position.
 */
export function findLongestCorrectPrefix(guesses: StoredGuess[]): CorrectPrefix | null {
  let best: CorrectPrefix | null = null;

  for (let guessIndex = guesses.length - 1; guessIndex >= 0; guessIndex -= 1) {
    const guess = guesses[guessIndex];
    const availableLength = Math.min(guess.statuses.length, guess.movesUci.length, guess.movesSan.length);
    let prefixLength = 0;

    while (prefixLength < availableLength && guess.statuses[prefixLength] === "correct") {
      prefixLength += 1;
    }

    if (prefixLength > (best?.movesUci.length ?? 0)) {
      best = {
        movesUci: guess.movesUci.slice(0, prefixLength),
        movesSan: guess.movesSan.slice(0, prefixLength),
      };
    }
  }

  return best?.movesUci.length ? best : null;
}
