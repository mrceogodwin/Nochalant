CREATE TABLE "ClubPostLike" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClubPostLike_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ClubPostComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" VARCHAR(2000) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubPostComment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ClubPollVote" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "option" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubPollVote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClubPostLike_postId_userId_key" ON "ClubPostLike"("postId","userId");
CREATE INDEX "ClubPostLike_userId_createdAt_idx" ON "ClubPostLike"("userId","createdAt");
CREATE INDEX "ClubPostComment_postId_status_createdAt_idx" ON "ClubPostComment"("postId","status","createdAt");
CREATE INDEX "ClubPostComment_authorId_createdAt_idx" ON "ClubPostComment"("authorId","createdAt");
CREATE UNIQUE INDEX "ClubPollVote_postId_userId_key" ON "ClubPollVote"("postId","userId");
CREATE INDEX "ClubPollVote_postId_option_idx" ON "ClubPollVote"("postId","option");
ALTER TABLE "ClubPostLike" ADD CONSTRAINT "ClubPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ClubPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubPostLike" ADD CONSTRAINT "ClubPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubPostComment" ADD CONSTRAINT "ClubPostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ClubPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubPostComment" ADD CONSTRAINT "ClubPostComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubPollVote" ADD CONSTRAINT "ClubPollVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ClubPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubPollVote" ADD CONSTRAINT "ClubPollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
