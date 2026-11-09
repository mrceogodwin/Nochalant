import { useEffect, useReducer } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { Button } from "@/components/club/ui";
import { useClub } from "@/lib/club/store";
import type { CollectibleId } from "@/lib/club/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/table")({ component: Table });

const suits = ["circle", "triangle", "cross", "square", "star"] as const;
type Suit = (typeof suits)[number];
type Card = { id: string; suit: Suit | "whot"; n: number };

type Game = {
  deck: Card[];
  you: Card[];
  rio: Card[];
  top: Card;
  called: Suit | null;
  turn: "you" | "rio" | "call" | "over";
  winner: "you" | "rio" | "draw" | null;
  line: string;
  tick: number;
};

function shuffle<T>(list: T[]) {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index]!;
    next[index] = next[swap]!;
    next[swap] = current;
  }
  return next;
}

function freshDeck() {
  const cards: Card[] = [];
  for (const suit of suits) {
    for (let n = 1; n <= 5; n += 1) cards.push({ id: `${suit}-${n}`, suit, n });
  }
  for (let index = 1; index <= 4; index += 1) cards.push({ id: `whot-${index}`, suit: "whot", n: 0 });
  return shuffle(cards);
}

function legal(card: Card, top: Card, called: Suit | null) {
  if (card.suit === "whot") return true;
  if (called) return card.suit === called;
  if (top.suit === "whot") return false;
  return card.suit === top.suit || card.n === top.n;
}

function favourite(hand: Card[]): Suit {
  const counts = Object.fromEntries(suits.map((suit) => [suit, 0])) as Record<Suit, number>;
  for (const card of hand) {
    if (card.suit !== "whot") counts[card.suit] += 1;
  }
  return [...suits].sort((a, b) => counts[b] - counts[a])[0] ?? "circle";
}

function deal(): Game {
  const deck = freshDeck();
  const you = deck.splice(0, 5);
  const rio = deck.splice(0, 5);
  let top = deck.pop();
  while (top && top.suit === "whot" && deck.length > 0) {
    deck.unshift(top);
    top = deck.pop();
  }
  return {
    deck,
    you,
    rio,
    top: top ?? { id: "fallback", suit: "circle", n: 1 },
    called: null,
    turn: "you",
    winner: null,
    line: "Match the shape or the number. Whot lets you call the next shape.",
    tick: 0,
  };
}

function finish(state: Game, winner: Game["winner"], line: string): Game {
  return { ...state, turn: "over", winner, line, tick: state.tick + 1 };
}

function playCard(state: Game, who: "you" | "rio", id: string, fromDraw = false): Game {
  const card = state[who].find((item) => item.id === id);
  if (!card || !legal(card, state.top, state.called)) return state;
  const hand = state[who].filter((item) => item.id !== id);
  const base = { ...state, [who]: hand, top: card, tick: state.tick + 1 };
  if (card.suit === "whot") {
    if (who === "rio") {
      const suit = favourite(hand);
      if (hand.length === 0) return finish({ ...base, called: suit }, "rio", `Rio called ${suit} and left the table.`);
      return { ...base, called: suit, turn: "you", line: `Rio called ${suit}.` };
    }
    return { ...base, called: null, turn: "call", line: "Call the next shape." };
  }
  if (hand.length === 0) return finish({ ...base, called: null }, who, who === "you" ? "You emptied your hand." : "Rio emptied first.");
  return {
    ...base,
    called: null,
    turn: who === "you" ? "rio" : "you",
    line: fromDraw ? (who === "you" ? "The draw fit, so it played." : "Rio drew into a play.") : who === "you" ? "Played. Rio's turn." : "Rio played.",
  };
}

function stuck(state: Game): Game {
  if (state.you.length === state.rio.length) return finish(state, "draw", "The deck is finished. Even hands.");
  const you = state.you.length < state.rio.length;
  return finish(state, you ? "you" : "rio", you ? "The deck is finished. You held fewer cards." : "The deck is finished. Rio held fewer cards.");
}

function drawOne(state: Game, who: "you" | "rio"): Game {
  const card = state.deck[0];
  if (!card) return stuck(state);
  const next = { ...state, deck: state.deck.slice(1), [who]: [...state[who], card], tick: state.tick + 1 };
  if (legal(card, state.top, state.called)) return playCard(next, who, card.id, true);
  return { ...next, turn: who === "you" ? "rio" : "you", line: who === "you" ? "Nothing that fits. Rio's hand." : "Rio drew and passed." };
}

function rioMove(state: Game): Game {
  if (state.turn !== "rio") return state;
  const plain = state.rio.find((card) => card.suit !== "whot" && legal(card, state.top, state.called));
  const whot = state.rio.find((card) => card.suit === "whot");
  const pick = plain ?? whot;
  if (!pick) return drawOne(state, "rio");
  return playCard(state, "rio", pick.id);
}

function callSuit(state: Game, suit: Suit): Game {
  if (state.you.length === 0) return finish({ ...state, called: suit }, "you", `You called ${suit} and left the table.`);
  return { ...state, called: suit, turn: "rio", line: `You called ${suit}.`, tick: state.tick + 1 };
}

type Action = { type: "play"; id: string } | { type: "draw" } | { type: "call"; suit: Suit } | { type: "rio" } | { type: "deal" };

function reducer(state: Game, action: Action): Game {
  if (action.type === "deal") return deal();
  if (action.type === "rio") return rioMove(state);
  if (action.type === "play" && state.turn === "you") return playCard(state, "you", action.id);
  if (action.type === "draw" && state.turn === "you") {
    if (state.you.some((card) => legal(card, state.top, state.called))) return state;
    return drawOne(state, "you");
  }
  if (action.type === "call" && state.turn === "call") return callSuit(state, action.suit);
  return state;
}

function objectFor(card: Card): CollectibleId {
  return card.suit === "whot" ? "chaos" : card.suit;
}

function Face({ card, playable, onPlay }: { card: Card; playable?: boolean; onPlay?: () => void }) {
  const body = (
    <>
      <span className="text-xs font-semibold tabular-nums">{card.suit === "whot" ? "WHOT" : card.n}</span>
      <span className="w-12">
        <Collectible id={objectFor(card)} />
      </span>
      <span className="text-[10px] tracking-widest text-muted">{card.suit === "whot" ? "CALL" : card.suit.toUpperCase()}</span>
    </>
  );
  if (!onPlay) {
    return <div className="flex h-32 w-[4.5rem] flex-col items-center justify-between rounded-2xl border border-line bg-card p-1.5">{body}</div>;
  }
  return (
    <button
      type="button"
      disabled={!playable}
      onClick={onPlay}
      className={cn(
        "flex h-32 w-[4.5rem] shrink-0 flex-col items-center justify-between rounded-2xl border bg-card p-1.5",
        playable ? "border-paper" : "border-line opacity-40",
      )}
    >
      {body}
    </button>
  );
}

function Table() {
  const [game, dispatch] = useReducer(reducer, undefined, deal);
  const complete = useClub((state) => state.completeChallenge);
  const canPlay = game.you.some((card) => legal(card, game.top, game.called));

  useEffect(() => {
    if (game.turn !== "rio") return;
    const timer = window.setTimeout(() => dispatch({ type: "rio" }), 700);
    return () => window.clearTimeout(timer);
  }, [game.turn, game.tick]);

  useEffect(() => {
    if (game.winner) complete("whot");
  }, [game.winner, complete]);

  return (
    <ClubPage title="The Table" kicker="Whot · no stakes" back="/discover" tabs={false}>
      <p className="text-sm text-secondary">{game.line}</p>
      <p className="mt-1 text-xs text-muted">Rio is across from you. Club Tokens stay off this table.</p>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-widest text-muted">RIO</p>
          <p className="font-display text-3xl tabular-nums">{game.rio.length}</p>
        </div>
        <Face card={game.top} />
        <div className="text-right">
          <p className="text-xs tracking-widest text-muted">DECK</p>
          <p className="font-display text-3xl tabular-nums">{game.deck.length}</p>
        </div>
      </div>
      {game.called ? <p className="mt-4 text-sm">Called shape: {game.called}</p> : null}
      {game.turn === "call" ? (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {suits.map((suit) => (
            <button key={suit} type="button" onClick={() => dispatch({ type: "call", suit })} className="w-16 shrink-0 rounded-2xl border border-line p-1">
              <Collectible id={suit} />
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {game.you.map((card) => (
          <Face
            key={card.id}
            card={card}
            playable={game.turn === "you" && legal(card, game.top, game.called)}
            onPlay={() => dispatch({ type: "play", id: card.id })}
          />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {game.turn === "over" ? (
          <Button full onClick={() => dispatch({ type: "deal" })}>
            New hand
          </Button>
        ) : (
          <Button full variant={canPlay ? "quiet" : "solid"} disabled={game.turn !== "you" || canPlay} onClick={() => dispatch({ type: "draw" })}>
            {game.turn === "rio" ? "Rio is playing" : canPlay ? "Play a card that fits" : "Draw one"}
          </Button>
        )}
      </div>
    </ClubPage>
  );
}
