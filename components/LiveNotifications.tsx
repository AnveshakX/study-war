"use client";

import { useEffect, useState } from "react";
import supabase from "@/supabase";

type EventType = {
  id: number;
  username: string;
  type: string;
  subject: string;
  topic: string;
  duration: number;
};

export default function LiveNotifications() {
  const [popup, setPopup] = useState<EventType | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("live-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_events",
        },
        (payload) => {
          setPopup(payload.new as EventType);

          setTimeout(() => {
            setPopup(null);
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!popup) return null;

  return (
    <div className="fixed top-5 right-5 bg-gray-900 text-white p-4 rounded-xl shadow-lg z-50">
      {popup.type === "start" ? (
        <p>
          🔥 {popup.username} started {popup.subject} ({popup.topic})
        </p>
      ) : (
        <p>
          ✅ {popup.username} finished {popup.subject} for{" "}
          {Math.floor(popup.duration / 60)} mins
        </p>
      )}
    </div>
  );
}