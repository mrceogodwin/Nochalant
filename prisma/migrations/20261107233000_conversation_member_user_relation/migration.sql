ALTER TABLE "ConversationMember"
ADD CONSTRAINT "ConversationMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "ConversationMember_userId_joinedAt_idx"
ON "ConversationMember"("userId", "joinedAt");
