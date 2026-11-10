"use client";

import { useEffect, useState, useTransition } from "react";
import { applyMove, botMove, initialBoard, legalMoves, type Board, type Move } from "@/lib/games/chess";
import { botLudo, moveToken, newLudo, rollDice, type LudoState } from "@/lib/games/ludo";
import { botPlay, deal, playCard, type Suit, type WhotState } from "@/lib/games/whot";

export function WhotTable() {
  const [state, setState] = useState<WhotState | null>(null);
  const [call, setCall] = useState<Suit>("circle");
  useEffect(() => {
    setState(deal());
  }, []);
  if (!state) return <p className="text-sm text-zinc-400">Shuffling the deck…</p>;
  function afterYou(next: WhotState | null) {
    if (!next) return;
    const played = next.current === 1 && next.winner == null ? botPlay(next) : next;
    setState(played);
  }
  return (
    <div>
      <p className="text-sm text-zinc-400">Top card: {state.top.suit} {state.top.rank === 20 ? "WHOT" : state.top.rank} {state.call ? `· call ${state.call}` : ""}</p>
      <p className="mt-1 text-sm">{state.winner == null ? (state.current === 0 ? "Your turn" : "Bot is thinking") : state.winner === 0 ? "You won" : "Bot won"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {state.hands[0].map((card) => (
          <button key={card.id} className="rounded-xl bg-white px-2 py-3 text-xs font-bold text-black" onClick={() => afterYou(playCard(state, 0, card.id, card.suit === "whot" ? call : undefined))}>
            {card.suit === "whot" ? "WHOT" : `${card.suit} ${card.rank}`}
          </button>
        ))}
      </div>
      {state.hands[0].some((card) => card.suit === "whot") ? (
        <label className="mt-3 block text-xs">
          If you play WHOT, call
          <select value={call} onChange={(event) => setCall(event.target.value as Suit)} className="ml-2 bg-black">
            {["circle", "triangle", "cross", "square", "star"].map((suit) => (
              <option key={suit}>{suit}</option>
            ))}
          </select>
        </label>
      ) : null}
      <p className="mt-3 text-xs text-zinc-500">Bot holds {state.hands[1].length} cards · market {state.market.length}</p>
    </div>
  );
}

const glyphs: Record<string, string> = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟", ".": "" };

export function ChessTable() {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [selected, setSelected] = useState<Move | null>(null);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const moves = legalMoves(board, "w");
  function tap(row: number, col: number) {
    if (turn !== "w") return;
    if (!selected) {
      const mine = moves.find((move) => move.fromR === row && move.fromC === col);
      if (mine) setSelected(mine);
      return;
    }
    const move = moves.find((item) => item.fromR === selected.fromR && item.fromC === selected.fromC && item.toR === row && item.toC === col);
    if (!move) {
      setSelected(moves.find((item) => item.fromR === row && item.fromC === col) ?? null);
      return;
    }
    const next = applyMove(board, move);
    const reply = botMove(next, "b");
    setBoard(reply ? applyMove(next, reply) : next);
    setTurn("w");
    setSelected(null);
  }
  return (
    <div className="grid grid-cols-8 overflow-hidden rounded-xl">
      {board.map((rank, row) =>
        rank.split("").map((piece, col) => {
          const dark = (row + col) % 2 === 1;
          const active = selected && selected.fromR === row && selected.fromC === col;
          const target = selected && moves.some((move) => move.fromR === selected.fromR && move.fromC === selected.fromC && move.toR === row && move.toC === col);
          return (
            <button key={`${row}-${col}`} onClick={() => tap(row, col)} className={`grid h-10 place-items-center text-xl ${dark ? "bg-[#3a2414]" : "bg-[#f3e2c4]"} ${active ? "ring-2 ring-[#ff7a00]" : ""} ${target ? "text-[#ff7a00]" : "text-black"}`}>
              {glyphs[piece]}
            </button>
          );
        }),
      )}
    </div>
  );
}

export function LudoTable() {
  const [state, setState] = useState<LudoState>(newLudo);
  const [pending, start] = useTransition();
  function roll() {
    const dice = rollDice();
    let moved = false;
    let next = state;
    for (const token of [0, 1] as const) {
      const attempt = moveToken(state, 0, token, dice);
      if (attempt) {
        next = attempt;
        moved = true;
        break;
      }
    }
    if (!moved) next = { ...state, dice, turn: 1 };
    if (next.turn === 1 && next.winner == null) next = botLudo(next);
    setState(next);
  }
  return (
    <div>
      <p className="text-sm text-zinc-300">You {state.tokens[0].join(", ")} · Bot {state.tokens[1].join(", ")}</p>
      <p className="mt-1 text-sm">{state.winner == null ? `Last roll ${state.dice ?? "—"}` : state.winner === 0 ? "You finished" : "Bot finished"}</p>
      <button disabled={pending || state.winner != null} onClick={() => start(roll)} className="orange-fill mt-4 h-12 rounded-full px-6 font-bold">
        Roll
      </button>
      <p className="mt-2 text-xs text-zinc-500">Yard is -1. A 6 enters. Land on 28 to finish. Landing on the bot sends them home.</p>
    </div>
  );
}
