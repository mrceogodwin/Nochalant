CREATE TABLE "SquadInvitation" (
  "id" TEXT NOT NULL,
  "squadId" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "inviteeUserId" TEXT,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SquadInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SquadInvitation_tokenHash_key" ON "SquadInvitation"("tokenHash");
CREATE INDEX "SquadInvitation_squadId_expiresAt_idx" ON "SquadInvitation"("squadId", "expiresAt");
CREATE INDEX "SquadInvitation_inviteeUserId_expiresAt_idx" ON "SquadInvitation"("inviteeUserId", "expiresAt");
ALTER TABLE "SquadInvitation" ADD CONSTRAINT "SquadInvitation_squadId_fkey"
FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
