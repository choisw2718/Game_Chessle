import type { GuessResult, TileStatus } from "@/lib/types";

export function evaluateGuess(
  answer: readonly string[],
  guess: readonly string[],
): GuessResult {
  if (answer.length !== guess.length) {
    throw new Error("Answer and guess must have the same number of plies.");
  }

  const statuses: TileStatus[] = Array(answer.length).fill("absent");
  const remaining = new Map<string, number>();

  for (let index = 0; index < answer.length; index += 1) {
    if (answer[index] === guess[index]) {
      statuses[index] = "correct";
    } else {
      remaining.set(answer[index], (remaining.get(answer[index]) ?? 0) + 1);
    }
  }

  for (let index = 0; index < guess.length; index += 1) {
    if (statuses[index] === "correct") continue;
    const count = remaining.get(guess[index]) ?? 0;
    if (count > 0) {
      statuses[index] = "present";
      remaining.set(guess[index], count - 1);
    }
  }

  return {
    statuses,
    solved: statuses.every((status) => status === "correct"),
  };
}
