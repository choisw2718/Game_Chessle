import datasetJson from "@/data/generated/problems.json";
import type { OpeningProblem, ProblemDataset, RevealedProblem } from "@/lib/types";

const dataset = datasetJson as ProblemDataset;

export function getDataset() {
  return dataset;
}

export function getEnabledProblems() {
  return dataset.problems.filter((problem) => problem.enabled);
}

export function getProblem(problemId: string) {
  return dataset.problems.find((problem) => problem.id === problemId) ?? null;
}

export function revealProblem(problem: OpeningProblem): RevealedProblem {
  return {
    id: problem.id,
    eco: problem.eco,
    openingName: problem.openingName,
    variationName: problem.variationName,
    subvariationName: problem.subvariationName,
    fullName: problem.fullName,
    movesSan: problem.movesSan,
    movesUci: problem.movesUci,
    terminalFen: problem.terminalFen,
    exactMasterGames: problem.exactMasterGames,
    eligibilityReasons: problem.eligibilityReasons,
    masterStatisticsSemantics: problem.source.masterStatisticsSemantics,
  };
}
