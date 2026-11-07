-- Add channel-level ownership to Scene discussions without changing existing posts.
ALTER TABLE "ScenePost"
ADD COLUMN "channelId" TEXT;

CREATE INDEX "ScenePost_channelId_status_createdAt_idx"
ON "ScenePost"("channelId", "status", "createdAt");

ALTER TABLE "ScenePost"
ADD CONSTRAINT "ScenePost_channelId_fkey"
FOREIGN KEY ("channelId") REFERENCES "SceneChannel"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
