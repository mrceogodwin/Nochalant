export type Suit = "circle" | "triangle" | "cross" | "square" | "star" | "whot";

export type Card = { id: string; suit: Suit; rank: number };

export type WhotState = {
  hands: [Card[], Card[]];
  market: Card[];
  top: Card;
  current: 0 | 1;
  call: Suit | null;
  winner: 0 | 1 | null;
};

const CALLS: Suit[] = ["circle", "triangle", "cross", "square", "star"];

export function buildDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of ["circle", "triangle", "cross", "square"] as Suit[]) {
    for (let rank = 1; rank <= 14; rank += 1) cards.push({ id: `${suit}-${rank}`, suit, rank });
  }
  for (let rank = 1; rank <= 8; rank += 1) cards.push({ id: `star-${rank}`, suit: "star", rank });
  for (let index = 1; index <= 5; index += 1) cards.push({ id: `whot-${index}`, suit: "whot", rank: 20 });
  return cards;
}

export function shuffle(cards: Card[], rng: () => number = Math.random) {
  const next = [...cards];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

export function deal(rng: () => number = Math.random): WhotState {
  const deck = shuffle(buildDeck(), rng);
  const hands: [Card[], Card[]] = [deck.slice(0, 6), deck.slice(6, 12)];
  const market = deck.slice(12);
  let top = market.shift()!;
  let guard = 0;
  while (top.suit === "whot" && guard < 8) {
    market.push(top);
    top = market.shift()!;
    guard += 1;
  }
  return { hands, market, top, current: 0, call: null, winner: null };
}

export function canPlay(card: Card, top: Card, call: Suit | null) {
  if (card.suit === "whot") return true;
  if (call) return card.suit === call;
  return card.suit === top.suit || card.rank === top.rank;
}

export function playCard(state: WhotState, index: 0 | 1, cardId: string, call?: Suit): WhotState | null {
  if (state.winner != null || state.current !== index) return null;
  const card = state.hands[index].find((item) => item.id === cardId);
  if (!card || !canPlay(card, state.top, state.call)) return null;
  if (card.suit === "whot" && !call) return null;
  const hands = state.hands.map((hand, handIndex) =>
    handIndex === index ? hand.filter((item) => item.id !== cardId) : hand,
  ) as [Card[], Card[]];
  const winner = hands[index].length === 0 ? index : null;
  return {
    ...state,
    hands,
    top: card,
    call: card.suit === "whot" ? call! : null,
    current: winner == null ? (index === 0 ? 1 : 0) : index,
    winner,
  };
}

export function drawCard(state: WhotState, index: 0 | 1): WhotState | null {
  if (state.winner != null || state.current !== index || state.market.length === 0) return null;
  const [card, ...market] = state.market;
  const hands = state.hands.map((hand, handIndex) => (handIndex === index ? [...hand, card] : hand)) as [
    Card[],
    Card[],
  ];
  return { ...state, hands, market, current: index === 0 ? 1 : 0 };
}

export function botPlay(state: WhotState, rng: () => number = Math.random): WhotState {
  const options = state.hands[state.current].filter((card) => canPlay(card, state.top, state.call));
  if (!options.length) return drawCard(state, state.current) ?? state;
  const card = options[Math.floor(rng() * options.length)];
  const call = card.suit === "whot" ? CALLS[Math.floor(rng() * CALLS.length)] : undefined;
  return playCard(state, state.current, card.id, call) ?? state;
}
