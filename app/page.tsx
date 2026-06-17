import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-4">Study War ⚔️</h1>

      <p className="text-gray-400 mb-8">
        Compete. Study. Dominate.
      </p>

      <div className="flex gap-4">
        <Link href="/timer">
          <button className="bg-white text-black px-6 py-3 rounded-xl font-semibold">
            Start Study
          </button>
        </Link>

        <Link href="/leaderboard">
          <button className="border border-white px-6 py-3 rounded-xl font-semibold">
            Leaderboard
          </button>
        </Link>
      </div>
    </main>
  );
}