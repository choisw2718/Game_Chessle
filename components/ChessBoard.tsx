"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import { moveToUci, replayUci } from "@/lib/chess/notation";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;
const PIECE_NAMES: Record<PieceSymbol, string> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function pieceAsset(color: Color, piece: PieceSymbol) {
  return `${BASE_PATH}/pieces/${color}${piece.toUpperCase()}.svg`;
}

interface ChessBoardProps {
  movesUci?: readonly string[];
  fen?: string;
  interactive?: boolean;
  disabled?: boolean;
  onMove?: (move: { uci: string; san: string }) => void;
  label?: string;
  compact?: boolean;
}

interface PendingPromotion {
  from: Square;
  to: Square;
}

interface DragState {
  from: Square;
  piece: PieceSymbol;
  color: Color;
  pointerId: number;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  active: boolean;
}

const DRAG_THRESHOLD = 6;

export function ChessBoard({
  movesUci = [],
  fen,
  interactive = false,
  disabled = false,
  onMove,
  label = "Chess position",
  compact = false,
}: ChessBoardProps) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const draggedPieceRef = useRef<HTMLImageElement | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const chess = useMemo(() => {
    if (fen) return new Chess(fen);
    return replayUci(movesUci).chess;
  }, [fen, movesUci]);
  const lastMove = movesUci.at(-1);
  const lastSquares = lastMove ? new Set([lastMove.slice(0, 2), lastMove.slice(2, 4)]) : new Set<string>();
  const legalTargets = useMemo(() => {
    if (!selected || !interactive || disabled) return new Map<string, boolean>();
    const result = new Map<string, boolean>();
    for (const move of chess.moves({ square: selected, verbose: true })) {
      result.set(move.to, Boolean(move.captured));
    }
    return result;
  }, [chess, disabled, interactive, selected]);

  function commitMove(from: Square, to: Square, promotion?: "q" | "r" | "b" | "n") {
    const next = new Chess(chess.fen());
    try {
      const move = next.move({ from, to, promotion });
      onMove?.({ uci: moveToUci(move), san: move.san });
      setSelected(null);
      setPendingPromotion(null);
    } catch {
      setSelected(null);
      setPendingPromotion(null);
    }
  }

  function attemptMove(from: Square, to: Square) {
    const candidates = chess.moves({ square: from, verbose: true }).filter((move) => move.to === to);
    if (!candidates.length) {
      setSelected(null);
      return;
    }
    if (candidates.some((move) => Boolean(move.promotion))) setPendingPromotion({ from, to });
    else commitMove(from, to);
  }

  function handleSquare(square: Square) {
    if (!interactive || disabled) return;
    const piece = chess.get(square);
    if (!selected) {
      if (piece?.color === chess.turn()) setSelected(square);
      return;
    }
    if (square === selected) {
      setSelected(null);
      return;
    }
    const candidates = chess.moves({ square: selected, verbose: true }).filter((move) => move.to === square);
    if (candidates.length) {
      attemptMove(selected, square);
      return;
    }
    if (piece?.color === chess.turn()) setSelected(square);
  }

  function handlePointerDown(square: Square, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!interactive || disabled || event.button !== 0) return;
    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const nextDrag: DragState = {
      from: square,
      piece: piece.type,
      color: piece.color,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      active: false,
    };
    dragRef.current = nextDrag;
  }

  function scheduleDraggedPiecePosition() {
    if (dragFrameRef.current !== null) return;
    dragFrameRef.current = window.requestAnimationFrame(() => {
      dragFrameRef.current = null;
      const currentDrag = dragRef.current;
      const draggedPiece = draggedPieceRef.current;
      if (!currentDrag?.active || !draggedPiece) return;
      draggedPiece.style.transform = `translate3d(${currentDrag.clientX}px, ${currentDrag.clientY}px, 0) translate(-50%, -50%)`;
    });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const currentDrag = dragRef.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
    const coalescedEvents = event.nativeEvent.getCoalescedEvents?.();
    const latestEvent = coalescedEvents?.at(-1) ?? event.nativeEvent;
    const moved = Math.hypot(latestEvent.clientX - currentDrag.startX, latestEvent.clientY - currentDrag.startY) >= DRAG_THRESHOLD;
    const active = currentDrag.active || moved;
    if (active) {
      event.preventDefault();
    }
    const nextDrag = { ...currentDrag, clientX: latestEvent.clientX, clientY: latestEvent.clientY, active };
    dragRef.current = nextDrag;
    if (!currentDrag.active && active) {
      setSelected(currentDrag.from);
      setDrag(nextDrag);
    }
    if (active) scheduleDraggedPiecePosition();
  }

  function finishDrag(event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) {
    const currentDrag = dragRef.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const active = currentDrag.active || Math.hypot(event.clientX - currentDrag.startX, event.clientY - currentDrag.startY) >= DRAG_THRESHOLD;
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
    dragRef.current = null;
    setDrag(null);
    if (!active) return;

    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 0);
    if (cancelled) {
      setSelected(null);
      return;
    }
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-square]");
    const to = target?.dataset.square as Square | undefined;
    if (to) attemptMove(currentDrag.from, to);
    else setSelected(null);
  }

  return (
    <div className={`board-wrap${compact ? " board-wrap--compact" : ""}`}>
      <div className={`chess-board${interactive ? " is-interactive" : ""}${drag?.active ? " is-dragging" : ""}`} role="grid" aria-label={label} data-testid="chess-board">
        {RANKS.flatMap((rank, rankIndex) =>
          FILES.map((file, fileIndex) => {
            const square = `${file}${rank}` as Square;
            const piece = chess.get(square);
            const isLight = (rankIndex + fileIndex) % 2 === 0;
            const isSelected = selected === square;
            const target = legalTargets.get(square);
            return (
              <button
                key={square}
                type="button"
                className={`board-square ${isLight ? "is-light" : "is-dark"}${isSelected ? " is-selected" : ""}${lastSquares.has(square) ? " is-last" : ""}`}
                aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${PIECE_NAMES[piece.type]}` : " empty"}`}
                aria-pressed={isSelected}
                data-square={square}
                onClick={() => {
                  if (!suppressClick.current) handleSquare(square);
                }}
                onPointerDown={(event) => handlePointerDown(square, event)}
                onPointerMove={handlePointerMove}
                onPointerUp={(event) => finishDrag(event)}
                onPointerCancel={(event) => finishDrag(event, true)}
                tabIndex={interactive ? 0 : -1}
              >
                {fileIndex === 0 && <span className="coord coord-rank">{rank}</span>}
                {rankIndex === 7 && <span className="coord coord-file">{file}</span>}
                {target !== undefined && <span className={target ? "legal-capture" : "legal-dot"} />}
                {piece && (
                  <img
                    className={`piece piece-${piece.color}${drag?.active && drag.from === square ? " is-drag-source" : ""}`}
                    src={pieceAsset(piece.color, piece.type)}
                    alt=""
                    draggable={false}
                  />
                )}
              </button>
            );
          }),
        )}
      </div>
      {drag?.active && (
        <img
          ref={draggedPieceRef}
          className="dragged-piece"
          src={pieceAsset(drag.color, drag.piece)}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{ transform: `translate3d(${drag.clientX}px, ${drag.clientY}px, 0) translate(-50%, -50%)` }}
        />
      )}
      {pendingPromotion && (
        <div className="promotion-picker" role="dialog" aria-label="Choose a promotion piece">
          <span>Promote to</span>
          <div>
            {(["q", "r", "b", "n"] as const).map((piece) => (
              <button key={piece} type="button" onClick={() => commitMove(pendingPromotion.from, pendingPromotion.to, piece)}>
                <img src={pieceAsset(chess.turn(), piece)} alt={PIECE_NAMES[piece]} draggable={false} />
              </button>
            ))}
          </div>
          <button className="text-button" type="button" onClick={() => setPendingPromotion(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
