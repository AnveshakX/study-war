"use client";

import { useEffect, useState } from "react";
import supabase from "@/supabase";
import Link from "next/link";

type UserProfile = {
  username: string;
  total: number;
  streak: number;
};

export default function ProfilesPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [myUsername, setMyUsername] = useState("");

  useEffect(() => {
    fetchMyUser();
    fetchProfiles();
  }, []);

  const fetchMyUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const { data } = await supabase
        .from("usernames")
        .select("username")
        .eq("email", user.email)
        .single();

      if (data?.username) {
        setMyUsername(data.username);
      }
    }
  };

  const fetchProfiles = async () => {
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("is_running", false);

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

    setUsers(sorted);
  };

  const sendChallenge = async (opponent: string) => {
    if (opponent === myUsername) {
      alert("You can't challenge yourself.");
      return;
    }

    const { data: existing } = await supabase
      .from("rivals")
      .select("*")
      .or(
        `and(challenger.eq.${myUsername},opponent.eq.${opponent}),and(challenger.eq.${opponent},opponent.eq.${myUsername})`
      );

    if (existing && existing.length > 0) {
      alert("Rival request already exists.");
      return;
    }

    await supabase.from("rivals").insert([
      {
        challenger: myUsername,
        opponent,
      },
    ]);

    alert(`Challenge sent to ${opponent} ⚔`);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    return `${hrs}h ${mins}m`;
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-5xl font-bold text-center mb-8">
        Warriors ⚔
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user, index) => (
          <div
            key={user.username}
            className="bg-gray-900 p-6 rounded-2xl"
          >
            <Link href={`/profile/${encodeURIComponent(user.username)}`}>
              <div className="cursor-pointer hover:bg-gray-800 transition rounded-xl p-2">
                <h2 className="text-2xl font-bold mb-2">
                  #{index + 1}
                </h2>

                <p className="text-lg break-words">{user.username}</p>

                <p className="text-green-400 mt-2">
                  Total: {formatTime(user.total)}
                </p>

                <p className="text-orange-400">
                  🔥 {user.streak} day streak
                </p>
              </div>
            </Link>

            {user.username !== myUsername && (
              <button
                onClick={() => sendChallenge(user.username)}
                className="mt-4 w-full bg-red-500 py-2 rounded-xl font-semibold"
              >
                Challenge ⚔
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}