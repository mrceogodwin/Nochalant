import { Mascot } from "@/components/brand";
import { CreateForm } from "@/components/forms";
import { BackHeader } from "@/components/shell";

export default function CreatePage() {
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/home" />
      <div className="relative">
        <h1 className="mt-3 text-4xl font-extrabold">Create a Scene</h1>
        <p className="mt-1 max-w-[240px] text-sm text-zinc-300">Start a conversation, host a talk, play a game or build your own community.</p>
        <span className="absolute right-0 top-0">
          <Mascot size={110} />
        </span>
      </div>
      <h2 className="mb-2 mt-6 font-bold">Choose a Scene Type</h2>
      <CreateForm />
    </main>
  );
}
