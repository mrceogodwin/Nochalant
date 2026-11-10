import assert from "node:assert/strict";
import test from "node:test";
import { buildDeck, canPlay, deal, playCard } from "./whot.ts";

test("whot deck keeps the standard shape counts", () => {
  assert.equal(buildDeck().length, 4 * 14 + 8 + 5);
});

test("a card plays on suit, rank, or as a whot wild", () => {
  const top = { id: "circle-5", suit: "circle" as const, rank: 5 };
  assert.equal(canPlay({ id: "whot-1", suit: "whot", rank: 20 }, top, null), true);
  assert.equal(canPlay({ id: "triangle-5", suit: "triangle", rank: 5 }, top, null), true);
  assert.equal(canPlay({ id: "triangle-2", suit: "triangle", rank: 2 }, top, null), false);
  assert.equal(canPlay({ id: "star-1", suit: "star", rank: 1 }, top, "star"), true);
});

test("playing a whot requires a called suit", () => {
  const state = deal(() => 0.42);
  const wild = state.hands[0].find((card) => card.suit === "whot");
  if (!wild) return;
  assert.equal(playCard(state, 0, wild.id), null);
  assert.ok(playCard(state, 0, wild.id, "star"));
});
