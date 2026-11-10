import assert from "node:assert/strict";
import test from "node:test";
import { applyMove, inCheck, initialBoard, legalMoves } from "./chess.ts";

test("the opening position has the twenty standard pawn and knight moves", () => {
  assert.equal(legalMoves(initialBoard(), "w").length, 20);
  assert.equal(inCheck(initialBoard(), "w"), false);
});

test("a king cannot step onto an attacked square", () => {
  const board = ["k.......", "........", "........", "........", "........", "........", "........", "R...K..."];
  const kingMoves = legalMoves(board, "b").filter((move) => move.fromR === 0 && move.fromC === 0);
  assert.equal(
    kingMoves.some((move) => move.toC === 0),
    false,
  );
  const e4 = legalMoves(initialBoard(), "w").find((move) => move.fromR === 6 && move.fromC === 4 && move.toR === 4);
  assert.ok(e4);
  assert.equal(applyMove(initialBoard(), e4!)[4][4], "P");
});
