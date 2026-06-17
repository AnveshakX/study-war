"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-gray-950 text-white px-8 py-4 flex gap-6 border-b border-gray-800">
      <Link href="/timer" className="hover:text-green-400">
        Timer ⏳
      </Link>

      <Link href="/leaderboard" className="hover:text-yellow-400">
        Leaderboard 🏆
      </Link>

      <Link href="/profiles" className="hover:text-blue-400">
        Profiles ⚔
      </Link>

      <Link href="/feed" className="hover:text-red-400">
        Feed 📢
      </Link>

      <Link href="/login" className="hover:text-purple-400">
        Login 🔐
      </Link>
    </nav>
  );
}