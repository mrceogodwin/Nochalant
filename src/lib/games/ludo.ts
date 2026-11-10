export type LudoState = {
  tokens: [[number, number], [number, number]];
  turn: 0 | 1;
  dice: number | null;
  winner: 0 | 1 | null;
};

const TRACK = 28;
const FINISH = 28;

export function newLudo(): LudoState {
  return { tokens: [[-1, -1], [-1, -1]], turn: 0, dice: null, winner: null };
}

export function rollDice(rng: () => number = Math.random) {
  return 1 + Math.floor(rng() * 6);
}

function opponentOn(state: LudoState, player: 0 | 1, square: number) {
  const other = player === 0 ? 1 : 0;
  return state.tokens[other].some((token) => token === square);
}

export function moveToken(state: LudoState, player: 0 | 1, token: 0 | 1, dice: number): LudoState | null {
  if (state.winner != null || state.turn !== player || dice < 1 || dice > 6) return null;
  const current = state.tokens[player][token];
  let next = current;
  if (current < 0) {
    if (dice !== 6) return null;
    next = 0;
  } else {
    next = current + dice;
    if (next > FINISH) return null;
  }
  const tokens: [[number, number], [number, number]] = [
    [state.tokens[0][0], state.tokens[0][1]],
    [state.tokens[1][0], state.tokens[1][1]],
  ];
  tokens[player][token] = next;
  if (next < FINISH && opponentOn({ ...state, tokens }, player, next)) {
    const other = player === 0 ? 1 : 0;
    tokens[other] = tokens[other].map((value) => (value === next ? -1 : value)) as [number, number];
  }
  const winner = tokens[player].every((value) => value === FINISH) ? player : null;
  return { tokens, turn: dice === 6 && winner == null ? player : player === 0 ? 1 : 0, dice, winner };
}

export function botLudo(state: LudoState, rng: () => number = Math.random): LudoState {
  const dice = rollDice(rng);
  const choices: Array<0 | 1> = [0, 1];
  for (const token of choices) {
    const moved = moveToken(state, state.turn, token, dice);
    if (moved) return moved;
  }
  return { ...state, dice, turn: state.turn === 0 ? 1 : 0 };
}

export const LUDO_TRACK = TRACK;
