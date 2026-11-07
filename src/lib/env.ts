const REQUIRED_SERVER_ENV = ["DATABASE_URL", "AUTH_SECRET"] as const;

export type RequiredServerEnv = (typeof REQUIRED_SERVER_ENV)[number];

/**
 * Read a required server-only environment variable at the point of use.
 * This avoids failing static builds merely because Preview credentials
 * have not yet been configured.
 */
export function getServerEnv(name: RequiredServerEnv): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required server environment variable: ${name}. Configure it in the server environment.`,
    );
  }

  return value;
}

/** Validate the minimum runtime configuration without exposing secret values. */
export function assertServerRuntimeEnv(): void {
  const missing = REQUIRED_SERVER_ENV.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missing.length > 0) {
    throw new Error(
      `Server runtime is not configured. Missing: ${missing.join(", ")}.`,
    );
  }
}
