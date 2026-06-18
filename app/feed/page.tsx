"use client";

import { useEffect, useState } from "react";
import supabase from "@/supabase";

type StudyEvent = {
  id: number;
  username: string;
  type: string;
  subject: string;
  topic: string;
  duration: number;
  created_at: string;
};

export default function FeedPage() {
  const [events, setEvents] = useState<StudyEvent[]>([]);

  useEffect(() => {
    fetchFeed();

    const channel = supabase
      .channel("study_events_feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_events",
        },
        (payload) => {
          setEvents((prev) => [payload.new as StudyEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFeed = async () => {
    const { data, error } = await supabase
      .from("study_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    return `${hrs}h ${mins}m`;
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-4xl font-bold mb-8">Global Feed 📢</h1>

      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-zinc-900 p-4 rounded-xl border border-zinc-700"
          >
            {event.type === "start" && (
              <p>
                🔥 <span className="font-bold">{event.username}</span> started{" "}
                <span className="text-blue-400">{event.subject}</span> —
                {event.topic}
              </p>
            )}

            {event.type === "end" && (
              <p>
                ✅ <span className="font-bold">{event.username}</span> finished{" "}
                <span className="text-green-400">{event.subject}</span> —
                {event.topic} ({formatDuration(event.duration)})
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}