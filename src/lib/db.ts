import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Row = Record<string, unknown>;

let cached: NeonQueryFunction<false, false> | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!cached) cached = neon(url);
  return cached;
}

export function str(row: Row, key: string) {
  const value = row[key];
  return value == null ? "" : String(value);
}

export function num(row: Row, key: string) {
  return Number(row[key] ?? 0);
}

export function bool(row: Row, key: string) {
  return Boolean(row[key]);
}

export function iso(row: Row, key: string) {
  const value = row[key];
  if (!value) return new Date().toISOString();
  return new Date(String(value)).toISOString();
}

export function textArray(row: Row, key: string) {
  const value = row[key];
  if (Array.isArray(value)) return value.map(String);
  return [];
}
