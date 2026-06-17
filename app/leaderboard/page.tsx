"use client";

import { useEffect, useState } from "react";
import supabase from "@/supabase";

type UserTotal = {
  username: string;
  total: number;
  streak: number;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<UserTotal[]>([]);
  const [roast, setRoast] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("*")
      .gte("created_at", today.toISOString());

    const { data: streaks } = await supabase
      .from("user_streaks")
      .select("*");

    if (!sessions || !streaks) return;

    const totals: { [key: string]: number } = {};

    sessions.forEach((session) => {
      if (!totals[session.username]) {
        totals[session.username] = 0;
      }

      totals[session.username] += session.duration;
    });

    const combined = Object.entries(totals).map(([username, total]) => {
      const userStreak =
        streaks.find((s) => s.username === username)?.streak || 0;

      return {
        username,
        total,
        streak: userStreak,
      };
    });

    const sorted = combined.sort((a, b) => b.total - a.total);

    setLeaderboard(sorted);

    if (sorted.length > 0) {
      const loser = sorted[sorted.length - 1].username;

      const roastMessages = [
        `${loser} opened books for decoration.`,
        `${loser} is fighting for last place.`,
        `${loser} might be allergic to studying.`,
        `${loser} logged in just to lose.`,
        `${loser} is donating ranks to everyone.`,
      ];

      const randomRoast =
        roastMessages[Math.floor(Math.random() * roastMessages.length)];

      setRoast(randomRoast);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    return `${hrs}h ${mins}m`;
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-5xl font-bold mb-4 text-center">
        Today’s Leaderboard 🏆
      </h1>

      {roast && (
        <p className="text-center text-red-400 mb-8 text-lg">
          🔥 {roast}
        </p>
      )}

      <div className="max-w-3xl mx-auto space-y-4">
        {leaderboard.map((user, index) => (
          <div
            key={user.username}
            className="flex justify-between items-center bg-gray-900 p-4 rounded-xl"
          >
            <div>
              <p className="font-bold text-xl">
                #{index + 1} {user.username}
              </p>
              <p className="text-orange-400">
                🔥 {user.streak} day streak
              </p>
            </div>

            <p className="text-lg font-semibold">
              {formatTime(user.total)}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}