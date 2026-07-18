"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { evaluateGuess } from "@/lib/chess/evaluate";
import { replayUci } from "@/lib/chess/notation";
import { dateKey, selectDailyProblem, selectRandomProblem } from "@/lib/game/selection";
import {
  appendPlayRecord,
  clearActiveGame,
  loadActiveGames,
  loadPlayHistory,
  saveActiveGame,
  summarizeHistory,
  type ActiveGame,
  type StoredGuess,
} from "@/lib/game/storage";
import { findLongestCorrectPrefix } from "@/lib/game/correct-prefix";
import { getDataset, getEnabledProblems, getProblem, revealProblem } from "@/lib/problems";
import type { PublicProblem, RevealedProblem } from "@/lib/types";
import { ChessBoard } from "./ChessBoard";
import gridStyles from "./GuessGrid.module.css";

function localDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function newPlay(problem: PublicProblem): ActiveGame {
  return {
    playId: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${problem.id}-${Date.now()}`,
    problem,
    guesses: [],
    currentUci: [],
    currentSan: [],
    status: "playing",
    startedAt: new Date().toISOString(),
    completedAt: null,
    reveal: null,
  };
}

function recordFinished(game: ActiveGame, outcome: "won" | "lost" | "abandoned") {
  appendPlayRecord({
    playId: game.playId,
    problemId: game.problem.id,
    mode: game.problem.mode,
    dateKey: game.problem.dateKey,
    outcome,
    attempts: game.guesses.length,
    guesses: game.guesses,
    startedAt: game.startedAt,
    completedAt: new Date().toISOString(),
  });
}

function GuessGrid({ game }: { game: ActiveGame }) {
  return (
    <div className={gridStyles.guessGrid} aria-label="Guess history">
      {Array.from({ length: game.problem.maxAttempts }, (_, rowIndex) => {
        const finished = game.guesses[rowIndex];
        const current = rowIndex === game.guesses.length && game.status === "playing";
        return (
          <div className={`${gridStyles.guessRow}${current ? ` ${gridStyles.current}` : ""}`} key={rowIndex} aria-label={`Guess ${rowIndex + 1}`}>
            {Array.from({ length: game.problem.plyCount / 2 }, (_, pairIndex) => {
              const whiteIndex = pairIndex * 2;
              const blackIndex = whiteIndex + 1;
              const moves = [whiteIndex, blackIndex];
              return (
                <div className={gridStyles.movePair} key={pairIndex}>
                  <b className={gridStyles.moveNumber}>{pairIndex + 1}.</b>
                  {moves.map((moveIndex) => {
                    const san = finished?.movesSan[moveIndex] ?? (current ? game.currentSan[moveIndex] : undefined);
                    const status = finished?.statuses[moveIndex];
                    const statusClass = status ? gridStyles[status] : "";
                    return (
                      <div
                        className={`${gridStyles.moveTile}${san ? ` ${gridStyles.hasMove}` : ""}${statusClass ? ` ${statusClass}` : ""}`}
                        key={moveIndex}
                        title={status ? `${san}: ${status}` : san}
                        aria-label={`${moveIndex % 2 === 0 ? "White" : "Black"} ${san ?? "empty"}`}
                      >
                        <strong>{san ?? ""}</strong>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function StatsDialog({ onClose }: { onClose: () => void }) {
  const history = loadPlayHistory();
  const stats = summarizeHistory(history);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className="modal-card stats-card" role="dialog" aria-modal="true" aria-labelledby="stats-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button>
        <p className="eyebrow">LOCAL RECORD</p>
        <h2 id="stats-title">Stats</h2>
        <div className="stats-grid">
          <div><strong>{stats.played}</strong><span>Played</span></div>
          <div><strong>{stats.winRate}%</strong><span>Win rate</span></div>
          <div><strong>{stats.averageAttempts ?? "—"}</strong><span>Avg. tries</span></div>
          <div><strong>{stats.currentStreak}</strong><span>Streak</span></div>
          <div><strong>{stats.bestStreak}</strong><span>Best</span></div>
        </div>
        <div className="history-list">
          {history.slice(0, 6).map((record) => (
            <div key={record.playId}>
              <span>{record.mode === "daily" ? record.dateKey : "Random"}</span>
              <strong className={`outcome-${record.outcome}`}>
                {record.outcome === "won" ? `${record.attempts}/6` : record.outcome === "lost" ? "X/6" : "Quit"}
              </strong>
            </div>
          ))}
          {!history.length && <p>No games</p>}
        </div>
      </section>
    </div>
  );
}

function ResultPanel({ game }: { game: ActiveGame }) {
  const reveal = game.reveal as RevealedProblem;
  return (
    <section className="result-panel" aria-live="polite">
      <div className={`result-mark ${game.status === "won" ? "won" : "lost"}`}>{game.status === "won" ? "✓" : "×"}</div>
      <div>
        <p className="eyebrow">{game.status === "won" ? `SOLVED IN ${game.guesses.length}` : "LINE REVEALED"}</p>
        <h2>{reveal.fullName}</h2>
        <p className="result-meta"><span>{reveal.eco}</span> {reveal.movesSan.map((san, index) => `${index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ""}${san}`).join(" ")}</p>
      </div>
      <div className="result-facts">
        <div><span>Eligible by</span><strong>{reveal.eligibilityReasons.includes("detailed-name") ? "Named variation" : "50+ master games"}</strong></div>
        <div><span>Master games</span><strong>{reveal.exactMasterGames?.toLocaleString() ?? "—"}</strong></div>
        <div><span>Tries</span><strong>{game.guesses.length} / 6</strong></div>
      </div>
      <div className="result-actions">
        <p className="result-policy-note"><strong>Transpositions</strong> Different move orders are different answers.</p>
      </div>
      <div className="terminal-board">
        <p className="eyebrow">FINAL POSITION</p>
        <ChessBoard fen={reveal.terminalFen} compact label="Answer position" />
      </div>
    </section>
  );
}

function GameResultDialog({
  game,
  onClose,
  onRandom,
}: {
  game: ActiveGame;
  onClose: () => void;
  onRandom: () => void;
}) {
  const reveal = game.reveal as RevealedProblem;
  const won = game.status === "won";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="result-dialog-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <div className={`result-confetti${won ? "" : " is-lost"}`} aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
      </div>
      <section className="result-dialog" role="dialog" aria-modal="true" aria-labelledby="game-result-title" aria-describedby="game-result-line">
        <button className="result-dialog-close" type="button" onClick={onClose} aria-label="Close result" autoFocus>×</button>
        <p className={`result-dialog-outcome ${won ? "is-correct" : "is-incorrect"}`}>{won ? "Correct" : "Incorrect"}</p>
        <h2 id="game-result-title">{reveal.fullName}</h2>
        <p id="game-result-line" className="result-dialog-meta">{reveal.eco}</p>
        <div className="result-dialog-actions">
          <button className="button button-primary" type="button" onClick={onRandom}>New Random</button>
        </div>
      </section>
    </div>
  );
}

export function ChessleGame() {
  const [mode, setMode] = useState<PublicProblem["mode"]>("daily");
  const [game, setGame] = useState<ActiveGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dismissedResultPlayId, setDismissedResultPlayId] = useState<string | null>(null);
  const skipNextModeLoad = useRef(false);

  const startProblem = useCallback(async (targetMode: PublicProblem["mode"], forceNew = false) => {
    setLoading(true);
    setError(null);
    const active = loadActiveGames()[targetMode];
    const validDaily = targetMode !== "daily" || active?.problem.dateKey === localDateKey();
    if (!forceNew && active && validDaily) {
      setGame(active);
      setLoading(false);
      return;
    }
    if (active && active.status === "playing") recordFinished(active, "abandoned");
    clearActiveGame(targetMode);
    try {
      const dataset = getDataset();
      const problems = getEnabledProblems();
      const exclusions = targetMode === "random"
        ? new Set(loadPlayHistory().slice(0, 120).map((record) => record.problemId))
        : new Set<string>();
      const selected = targetMode === "daily"
        ? selectDailyProblem(problems)
        : {
            problem: selectRandomProblem(problems, exclusions),
            sequenceNumber: 0,
            dateKey: dateKey(),
          };
      const sequenceNumber = targetMode === "daily"
        ? selected.sequenceNumber
        : dataset.problems.findIndex((problem) => problem.id === selected.problem.id) + 1;
      const next = newPlay({
        id: selected.problem.id,
        sequenceNumber,
        mode: targetMode,
        dateKey: selected.dateKey,
        plyCount: dataset.problemLength,
        maxAttempts: dataset.maxAttempts,
      });
      saveActiveGame(next);
      setGame(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load a puzzle.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipNextModeLoad.current) {
      skipNextModeLoad.current = false;
      return;
    }
    void startProblem(mode);
  }, [mode, startProblem]);

  function startRandomProblem() {
    if (mode !== "random") skipNextModeLoad.current = true;
    setMode("random");
    void startProblem("random", true);
  }

  const position = useMemo(() => {
    if (!game) return null;
    return replayUci(game.currentUci).chess;
  }, [game]);

  function updateCurrent(transform: (game: ActiveGame) => ActiveGame) {
    setGame((current) => {
      if (!current || current.status !== "playing") return current;
      const next = transform(current);
      saveActiveGame(next);
      return next;
    });
  }

  function handleMove(move: { uci: string; san: string }) {
    updateCurrent((current) => {
      if (current.currentUci.length >= current.problem.plyCount) return current;
      return {
        ...current,
        currentUci: [...current.currentUci, move.uci],
        currentSan: [...current.currentSan, move.san],
      };
    });
  }

  function undo() {
    updateCurrent((current) => ({
      ...current,
      currentUci: current.currentUci.slice(0, -1),
      currentSan: current.currentSan.slice(0, -1),
    }));
  }

  function resetLine() {
    updateCurrent((current) => ({ ...current, currentUci: [], currentSan: [] }));
  }

  function loadCorrectPrefix() {
    if (!reusableCorrectPrefix) return;
    updateCurrent((current) => ({
      ...current,
      currentUci: [...reusableCorrectPrefix.movesUci],
      currentSan: [...reusableCorrectPrefix.movesSan],
    }));
    setToast(`Filled ${reusableCorrectPrefix.movesUci.length} previously correct ply`);
    window.setTimeout(() => setToast(null), 1800);
  }

  function submitGuess() {
    if (!game || game.currentUci.length !== game.problem.plyCount || game.status !== "playing" || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const problem = getProblem(game.problem.id);
      if (!problem || !problem.enabled) throw new Error("Could not score this guess.");
      const answerKeys = replayUci(problem.movesUci).comparisonKeys;
      const guessKeys = replayUci(game.currentUci).comparisonKeys;
      const payload = evaluateGuess(answerKeys, guessKeys);
      const reveal = payload.solved || game.guesses.length + 1 >= game.problem.maxAttempts
        ? revealProblem(problem)
        : undefined;
      const guess: StoredGuess = {
        movesUci: game.currentUci,
        movesSan: game.currentSan,
        statuses: payload.statuses,
      };
      const guesses = [...game.guesses, guess];
      const status: ActiveGame["status"] = payload.solved ? "won" : guesses.length >= game.problem.maxAttempts ? "lost" : "playing";
      const next: ActiveGame = {
        ...game,
        guesses,
        currentUci: [],
        currentSan: [],
        status,
        reveal: reveal ?? null,
        completedAt: status === "playing" ? null : new Date().toISOString(),
      };
      saveActiveGame(next);
      setGame(next);
      if (status !== "playing") recordFinished(next, status === "won" ? "won" : "lost");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not score this guess.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentCount = game?.currentUci.length ?? 0;
  const reusableCorrectPrefix = game ? findLongestCorrectPrefix(game.guesses) : null;
  const correctPrefixLoaded = Boolean(
    reusableCorrectPrefix
    && reusableCorrectPrefix.movesUci.length === game?.currentUci.length
    && reusableCorrectPrefix.movesUci.every((move, index) => move === game?.currentUci[index]),
  );
  const currentTurn = position?.turn() === "w" ? "White" : "Black";
  const complete = game?.status !== "playing";

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Chessle home">
          <strong>CHESSLE</strong>
        </Link>
        <nav aria-label="Main menu">
          <button className={mode === "daily" ? "active" : ""} type="button" onClick={() => setMode("daily")}>Daily</button>
          <button className={mode === "random" ? "active" : ""} type="button" onClick={() => setMode("random")}>Random</button>
          <button type="button" onClick={() => setShowStats(true)}>Stats</button>
        </nav>
      </header>

      {loading && <section className="loading-card" role="status"><span className="loading-knight">♞</span><p>Loading…</p></section>}
      {error && <div className="error-banner" role="alert">{error}<button type="button" onClick={() => void startProblem(mode, true)}>Retry</button></div>}

      {!loading && game && (
        <>
          <section className="play-layout">
            <div className="board-heading">
              <div>
                <span className="mode-chip">{game.problem.mode === "daily" ? "DAILY" : "PRACTICE"}</span>
                <strong>#{game.problem.sequenceNumber}</strong>
              </div>
              <p>{complete ? "Finished" : `${currentTurn} to move${position?.isCheck() ? " · Check" : ""}`}</p>
            </div>
            <div className="board-stage">
              <ChessBoard
                movesUci={game.currentUci}
                interactive={!complete}
                disabled={submitting || currentCount >= game.problem.plyCount}
                onMove={handleMove}
                label="Move input board"
              />
            </div>

            <div className="attempt-column">
              <GuessGrid game={game} />
              {!complete && (
                <div className="guess-actions" aria-label="Move controls">
                  <button
                    className="load-correct-prefix"
                    type="button"
                    disabled={!reusableCorrectPrefix || correctPrefixLoaded || submitting}
                    onClick={loadCorrectPrefix}
                    title={reusableCorrectPrefix ? `Fill ${reusableCorrectPrefix.movesUci.length} previously correct ply` : "No correct opening moves to fill yet"}
                  >
                    <span aria-hidden="true">⟲</span>
                    Fill Previously Correct
                  </button>
                  <button className="guess-action-secondary" type="button" onClick={undo} disabled={!currentCount || submitting}>↶ Undo</button>
                  <button className="guess-action-secondary" type="button" onClick={resetLine} disabled={!currentCount || submitting}>Reset</button>
                  <button
                    className="submit-guess"
                    type="button"
                    disabled={currentCount !== game.problem.plyCount || submitting}
                    onClick={submitGuess}
                  >
                    {submitting ? "Scoring…" : currentCount === game.problem.plyCount ? "Submit" : `${game.problem.plyCount - currentCount} ply left`}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}
            </div>
            <button
              className="new-random-problem"
              type="button"
              onClick={startRandomProblem}
            >
              <span>New Random</span>
              <strong aria-hidden="true">→</strong>
            </button>
          </section>

          {complete && game.reveal && <ResultPanel game={game} />}
        </>
      )}

      {showStats && <StatsDialog onClose={() => setShowStats(false)} />}
      {game && complete && game.reveal && dismissedResultPlayId !== game.playId && (
        <GameResultDialog
          game={game}
          onClose={() => setDismissedResultPlayId(game.playId)}
          onRandom={startRandomProblem}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
