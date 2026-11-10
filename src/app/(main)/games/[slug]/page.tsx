import { notFound } from "next/navigation";
import { ChessTable, LudoTable, WhotTable } from "@/components/games-ui";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { listGames } from "@/lib/data";

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const games = await listGames();
  const game = games.find((item) => item.slug === slug);
  if (!game) notFound();
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/games" />
      <h1 className="mt-4 text-3xl font-extrabold">{game.name}</h1>
      <p className="mb-4 text-sm text-zinc-400">{game.blurb} This table is you versus a bot. Realtime multiplayer needs a game server key.</p>
      {slug === "whot" ? <WhotTable /> : null}
      {slug === "checkmate" ? <ChessTable /> : null}
      {slug === "ludo" ? <LudoTable /> : null}
      {slug === "more" ? (
        <ul className="space-y-2 text-sm">
          {["Dominoes", "Draft", "Trivia"].map((name) => (
            <li key={name} className="card rounded-2xl px-4 py-3">{name} is on the roadmap.</li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
