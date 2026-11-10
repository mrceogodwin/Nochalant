import { notFound } from "next/navigation";
import { Avatar } from "@/components/brand";
import { ChatComposer, MarkRead } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { chatMessages, getChat } from "@/lib/data";
import { relativeTime } from "@/lib/format";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const chat = await getChat(id, user.id);
  if (!chat) notFound();
  const messages = await chatMessages(id, user.id);
  return (
    <main className="flex min-h-[70dvh] flex-col px-4 pt-2">
      <MarkRead chatId={id} />
      <BackHeader back="/chats" />
      <h1 className="mt-3 text-2xl font-extrabold">{chat.title}</h1>
      <div className="mt-4 flex-1 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-3xl px-4 py-2 ${message.mine ? "orange-fill text-black" : "card"}`}>
              {!message.mine ? (
                <p className="text-xs font-bold">
                  <Avatar username={message.username} size={16} /> {message.displayName}
                </p>
              ) : null}
              <p>{message.body}</p>
              <p className={`text-[10px] ${message.mine ? "text-black/70" : "text-zinc-500"}`}>{relativeTime(message.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <ChatComposer chatId={id} />
      </div>
    </main>
  );
}
