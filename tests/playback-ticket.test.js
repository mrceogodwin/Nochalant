import test from "node:test";
import assert from "node:assert/strict";
import { issuePlaybackTicket, verifyPlaybackTicket } from "../api/_lib/playback-ticket.js";

const secret = "test-only-secret-that-is-at-least-32-bytes-long";
const trackId = "123e4567-e89b-12d3-a456-426614174000";
const sessionHash = "a".repeat(64);
const now = Date.parse("2026-11-01T12:00:00.000Z");

test("issues a signed ticket bound to a track and server timestamp", () => {
  const issued = issuePlaybackTicket(trackId, 30, secret, sessionHash, now);
  assert.equal(issued.eligibleSeconds, 30);
  assert.equal(verifyPlaybackTicket(issued.ticket, trackId, secret, now + 30_000)?.trackId, trackId);
  assert.equal(verifyPlaybackTicket(issued.ticket, trackId, secret, now + 30_000)?.sessionHash, sessionHash);
});

test("rejects tampered tickets and wrong-track redemption", () => {
  const ticket = issuePlaybackTicket(trackId, 30, secret, now).ticket;
  assert.equal(verifyPlaybackTicket(ticket + "x", trackId, secret, now + 30_000), null);
  assert.equal(verifyPlaybackTicket(ticket, "223e4567-e89b-12d3-a456-426614174000", secret, now + 30_000), null);
});

test("rejects early redemption and expired tickets", () => {
  const ticket = issuePlaybackTicket(trackId, 30, secret, now).ticket;
  assert.equal(verifyPlaybackTicket(ticket, trackId, secret, now + 29_000), null);
  assert.equal(verifyPlaybackTicket(ticket, trackId, secret, now + 15 * 60_000 + 1_000), null);
});

test("rejects missing or weak signing secrets", () => {
  assert.throws(() => issuePlaybackTicket(trackId, 30, "weak", now));
  const ticket = issuePlaybackTicket(trackId, 30, secret, now).ticket;
  assert.equal(verifyPlaybackTicket(ticket, trackId, "", now + 30_000), null);
});
