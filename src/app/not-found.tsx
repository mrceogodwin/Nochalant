import Link from "next/link";

export default function NotFound() {
  return (
    <main className="px-6 pt-20 text-center">
      <h1 className="text-3xl font-extrabold">That page left the room</h1>
      <Link href="/home" className="mt-4 inline-block font-bold text-[#ff7a00]">Back home</Link>
    </main>
  );
}
