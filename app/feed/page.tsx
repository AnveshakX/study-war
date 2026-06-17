"use client";

import { useEffect, useState } from "react";
import supabase from "@/supabase";

type FeedItem = {
  id: number;
  username: string;
  subject: string;
  topic: string;
  duration: number;
  created_at: string;
};

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    fetchFeed();

    const channel = supabase
      .channel("study-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_sessions",
        },
        () => {
          fetchFeed();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFeed = async () => {
    const { data } = await supabase
      .from("study_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setFeed(data);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-5xl font-bold text-center mb-8">
        Global Feed 📢
      </h1>

      <div className="max-w-3xl mx-auto space-y-4">
        {feed.map((item) => (
          <div
            key={item.id}
            className="bg-gray-900 p-4 rounded-xl"
          >
            <p className="text-lg">
              <span className="font-bold text-green-400">
                {item.username}
              </span>{" "}
              studied{" "}
              <span className="text-blue-400">
                {item.subject}
              </span>{" "}
              ({item.topic}) for{" "}
              <span className="text-yellow-400">
                {formatTime(item.duration)}
              </span>
            </p>

            <p className="text-sm text-gray-400 mt-2">
              {new Date(item.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}