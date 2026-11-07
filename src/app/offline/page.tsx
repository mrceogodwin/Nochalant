import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="club-shell justify-center text-center">
      <p className="eyebrow">Connection lost</p>
      <h1 className="display-title">Still in the <span>Club.</span></h1>
      <p className="supporting mb-8">Reconnect to refresh your Scenes and conversations. Your account stays safe.</p>
      <Link href="/" className="club-primary flex items-center justify-center no-underline">Try again →</Link>
    </main>
  );
}
