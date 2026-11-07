import argon2 from "argon2";

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Hash a new password with Argon2id.
 * Keep password input unchanged: trimming would silently alter credentials.
 */
export async function hashPassword(password: string): Promise<string> {
  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    throw new Error(
      `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    );
  }

  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}

/** Verify a password against an Argon2 hash without exposing hash errors. */
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  if (!password || !passwordHash) return false;

  try {
    return await argon2.verify(passwordHash, password, {
      type: argon2.argon2id,
    });
  } catch {
    return false;
  }
}
