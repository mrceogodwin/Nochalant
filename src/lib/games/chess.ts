export type Color = "w" | "b";
export type Board = string[];
export type Move = { fromR: number; fromC: number; toR: number; toC: number };

const KNIGHT = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];
const KING = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];
const BISHOP = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
const ROOK = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export function initialBoard(): Board {
  return ["rnbqkbnr", "pppppppp", "........", "........", "........", "........", "PPPPPPPP", "RNBQKBNR"];
}

function isWhite(piece: string) {
  return /[KQRBNP]/.test(piece);
}
function isBlack(piece: string) {
  return /[kqrbnp]/.test(piece);
}
function colorOf(piece: string): Color | null {
  if (isWhite(piece)) return "w";
  if (isBlack(piece)) return "b";
  return null;
}
function inside(row: number, col: number) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}
function at(board: Board, row: number, col: number) {
  return board[row][col];
}
function set(board: Board, row: number, col: number, piece: string): Board {
  const next = board.slice();
  const chars = next[row].split("");
  chars[col] = piece;
  next[row] = chars.join("");
  return next;
}

function slide(board: Board, row: number, col: number, dirs: number[][], color: Color, out: Move[]) {
  for (const [dr, dc] of dirs) {
    let nextRow = row + dr;
    let nextCol = col + dc;
    while (inside(nextRow, nextCol)) {
      const target = at(board, nextRow, nextCol);
      if (target === ".") out.push({ fromR: row, fromC: col, toR: nextRow, toC: nextCol });
      else {
        if (colorOf(target) !== color) out.push({ fromR: row, fromC: col, toR: nextRow, toC: nextCol });
        break;
      }
      nextRow += dr;
      nextCol += dc;
    }
  }
}

function pseudo(board: Board, color: Color, attacksOnly = false): Move[] {
  const out: Move[] = [];
  const mine = color === "w" ? isWhite : isBlack;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = at(board, row, col);
      if (!mine(piece)) continue;
      const kind = piece.toLowerCase();
      if (kind === "n" || kind === "k") {
        for (const [dr, dc] of kind === "n" ? KNIGHT : KING) {
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (!inside(nextRow, nextCol)) continue;
          const target = at(board, nextRow, nextCol);
          if (target === "." || colorOf(target) !== color) {
            out.push({ fromR: row, fromC: col, toR: nextRow, toC: nextCol });
          }
        }
      } else if (kind === "b") slide(board, row, col, BISHOP, color, out);
      else if (kind === "r") slide(board, row, col, ROOK, color, out);
      else if (kind === "q") slide(board, row, col, [...BISHOP, ...ROOK], color, out);
      else if (kind === "p") {
        const dir = color === "w" ? -1 : 1;
        const start = color === "w" ? 6 : 1;
        if (!attacksOnly && inside(row + dir, col) && at(board, row + dir, col) === ".") {
          out.push({ fromR: row, fromC: col, toR: row + dir, toC: col });
          if (row === start && at(board, row + dir * 2, col) === ".") {
            out.push({ fromR: row, fromC: col, toR: row + dir * 2, toC: col });
          }
        }
        for (const dc of [-1, 1]) {
          const nextRow = row + dir;
          const nextCol = col + dc;
          if (!inside(nextRow, nextCol)) continue;
          const target = at(board, nextRow, nextCol);
          if ((target !== "." && colorOf(target) !== color) || (attacksOnly && target === ".")) {
            out.push({ fromR: row, fromC: col, toR: nextRow, toC: nextCol });
          }
        }
      }
    }
  }
  return out;
}

export function applyMove(board: Board, move: Move): Board {
  const piece = at(board, move.fromR, move.fromC);
  let placed = piece;
  if (piece === "P" && move.toR === 0) placed = "Q";
  if (piece === "p" && move.toR === 7) placed = "q";
  return set(set(board, move.fromR, move.fromC, "."), move.toR, move.toC, placed);
}

export function inCheck(board: Board, color: Color) {
  const king = color === "w" ? "K" : "k";
  let kingRow = -1;
  let kingCol = -1;
  for (let row = 0; row < 8; row += 1) {
    const col = board[row].indexOf(king);
    if (col >= 0) {
      kingRow = row;
      kingCol = col;
      break;
    }
  }
  if (kingRow < 0) return true;
  const opponent: Color = color === "w" ? "b" : "w";
  return pseudo(board, opponent, true).some((move) => move.toR === kingRow && move.toC === kingCol);
}

export function legalMoves(board: Board, color: Color) {
  return pseudo(board, color).filter((move) => !inCheck(applyMove(board, move), color));
}

export function botMove(board: Board, color: Color, rng: () => number = Math.random) {
  const moves = legalMoves(board, color);
  if (!moves.length) return null;
  return moves[Math.floor(rng() * moves.length)];
}
