CREATE TABLE "ClubPost" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'POST',
  "body" VARCHAR(5000) NOT NULL,
  "options" JSONB,
  "audience" TEXT NOT NULL DEFAULT 'EVERYONE',
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ClubPost_status_createdAt_idx" ON "ClubPost"("status", "createdAt");
CREATE INDEX "ClubPost_authorId_createdAt_idx" ON "ClubPost"("authorId", "createdAt");
