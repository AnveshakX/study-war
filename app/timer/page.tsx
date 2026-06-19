"use client";

import { useState, useEffect } from "react";
import supabase from "@/supabase";
import { useRouter } from "next/navigation";

const quotes = [
  "No one is coming to save you.",
  "Your rival is studying right now.",
  "The pain of discipline is lighter than regret.",
  "Comfort kills ambition.",
  "You will either suffer now or suffer later.",
  "One day or day one. Decide.",
  "Every wasted hour is someone else’s advantage.",
  "The future is built in boring hours.",
  "You don’t get what you wish for. You get what you work for.",
  "The dream is free. The grind is not.",
  "Temporary pain. Permanent respect.",
  "Your family deserves your best version.",
  "Regret weighs more than effort.",
  "The weak wait. The strong begin.",
  "Discipline is self-respect.",
  "Your excuses are expensive.",
  "You are being watched by your future self.",
  "Win in silence.",
  "The world rewards consistency.",
  "Nobody remembers average.",
];

export default function TimerPage() {
  const [username, setUsername] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const router = useRouter();

  // Get user
  useEffect(() => {
    const getUser = async () => {
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
          setUsername(data.username);
        } else {
          setUsername(user.email.split("@")[0]);
        }
      } else {
        router.push("/login");
      }
    };

    getUser();
  }, [router]);

  // Restore active timer
  useEffect(() => {
    const restoreTimer = async () => {
      if (!username) return;

      const { data } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("username", username)
        .eq("is_running", true)
        .single();

      if (data) {
        const started = new Date(data.started_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - started) / 1000);

        setSeconds(data.accumulated + elapsed);
        setStartedAt(started);
        setRunning(true);
        setSubject(data.subject);
        setTopic(data.topic);
      }
    };

    restoreTimer();
  }, [username]);

  // Live ticking
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (running && startedAt) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [running, startedAt]);

  // Quote rotation every 90 sec
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 90000);

    return () => clearInterval(interval);
  }, []);

  // Anti-cheat check
  useEffect(() => {
    if (!running) return;

    const checkInterval = setInterval(() => {
      const answer = window.confirm("Still studying?");

      if (!answer) {
        pauseTimer();
      }
    }, 1200000);

    return () => clearInterval(checkInterval);
  }, [running]);

  // Activity tracking
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
    };
  }, []);

  // Idle detection
  useEffect(() => {
    const idleCheck = setInterval(() => {
      const idleTime = Date.now() - lastActivity;

      if (running && idleTime > 900000) {
        const answer = window.confirm("Slept?? 😴");

        if (!answer) {
          pauseTimer();
        } else {
          setLastActivity(Date.now());
        }
      }
    }, 60000);

    return () => clearInterval(idleCheck);
  }, [running, lastActivity]);

  const pauseTimer = async () => {
    setRunning(false);

    await supabase
      .from("study_sessions")
      .update({
        accumulated: seconds,
        is_running: false,
      })
      .eq("username", username)
      .eq("is_running", true);
  };

  const startTimer = async () => {
    if (!subject || !topic) {
      alert("Fill subject and topic first.");
      return;
    }

    const now = new Date();

    if (!running) {
      setRunning(true);
      setStartedAt(Date.now());

      const { data } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("username", username)
        .eq("is_running", false)
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        await supabase
          .from("study_sessions")
          .update({
            is_running: true,
            started_at: now.toISOString(),
          })
          .eq("id", data.id);
      } else {
        await supabase.from("study_sessions").insert([
          {
            username,
            subject,
            topic,
            duration: 0,
            is_running: true,
            started_at: now.toISOString(),
            accumulated: 0,
          },
        ]);
      }
    }
  };

  const stopAndSave = async () => {
    setRunning(false);

    await supabase
      .from("study_sessions")
      .update({
        duration: seconds,
        is_running: false,
        accumulated: seconds,
      })
      .eq("username", username)
      .eq("is_running", true);

    alert("Study session saved!");
  };

  const formatTime = () => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 md:px-8">
      <h1 className="text-3xl md:text-5xl font-bold mb-8 text-center">
        Study Timer ⏳
      </h1>

      <div className="flex flex-col gap-4 mb-8 w-full max-w-sm">
        <p className="text-green-400 text-center">Logged in as {username}</p>

        <button
          onClick={logout}
          className="bg-yellow-500 px-4 py-2 rounded-xl"
        >
          Logout
        </button>

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="p-3 rounded-lg bg-white text-black"
        >
          <option value="">Select Subject</option>
          <option value="Math">Math</option>
          <option value="Physics">Physics</option>
          <option value="Chemistry">Chemistry</option>
        </select>

        <input
          type="text"
          placeholder="Enter Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="p-3 rounded-lg bg-white text-black"
        />
      </div>

      <div className="text-5xl md:text-7xl font-mono mb-8 text-center">
        {formatTime()}
      </div>

      <p className="text-center text-gray-300 italic max-w-xl mb-8 px-4">
        {quotes[quoteIndex]}
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={running ? pauseTimer : startTimer}
          className={`px-6 py-3 rounded-xl font-semibold ${
            running ? "bg-yellow-500" : "bg-green-500"
          }`}
        >
          {running ? "Pause" : "Start"}
        </button>

        <button
          onClick={stopAndSave}
          className="bg-red-500 px-6 py-3 rounded-xl font-semibold"
        >
          Stop & Save
        </button>
      </div>
    </main>
  );
}