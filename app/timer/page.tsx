"use client";

import { useState, useEffect } from "react";
import supabase from "@/supabase";
import { useRouter } from "next/navigation";

export default function TimerPage() {
  const [username, setUsername] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [lastActivity, setLastActivity] = useState(Date.now());

  const router = useRouter();

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setUsername(user.email.split("@")[0]);
      } else {
        router.push("/login");
      }
    };

    getUser();
  }, [router]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (running) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [running]);

  // Random "Still studying?" check every 20 mins
  useEffect(() => {
    if (!running) return;

    const checkInterval = setInterval(() => {
      const answer = window.confirm("Still studying?");

      if (!answer) {
        setRunning(false);
        alert("Timer paused.");
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
          setRunning(false);
          alert("Timer paused due to inactivity.");
        } else {
          setLastActivity(Date.now());
        }
      }
    }, 60000);

    return () => clearInterval(idleCheck);
  }, [running, lastActivity]);

  // Format timer
  const formatTime = () => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Create study event
  const createEvent = async (type: string, duration = 0) => {
    await supabase.from("study_events").insert([
      {
        username,
        type,
        subject,
        topic,
        duration,
      },
    ]);
  };

  // Update streak
  const updateStreak = async () => {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split("T")[0];

    const { data } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("username", username)
      .single();

    if (!data) {
      await supabase.from("user_streaks").insert([
        {
          username,
          streak: 1,
          last_studied: todayString,
        },
      ]);
      return;
    }

    if (data.last_studied === todayString) return;

    if (data.last_studied === yesterdayString) {
      await supabase
        .from("user_streaks")
        .update({
          streak: data.streak + 1,
          last_studied: todayString,
        })
        .eq("username", username);
    } else {
      await supabase
        .from("user_streaks")
        .update({
          streak: 1,
          last_studied: todayString,
        })
        .eq("username", username);
    }
  };

  // Save study session
  const saveSession = async () => {
    if (!subject || !topic || seconds === 0) {
      alert("Fill everything and study first.");
      return;
    }

    const { error } = await supabase.from("study_sessions").insert([
      {
        username,
        subject,
        topic,
        duration: seconds,
      },
    ]);

    if (error) {
      alert("Error saving session.");
      console.log(error);
    } else {
      await updateStreak();
      alert("Study session saved!");
    }
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-5xl font-bold mb-8">Study Timer ⏳</h1>

      <div className="flex flex-col gap-4 mb-8 w-80">
        <p className="text-green-400 text-center">
          Logged in as {username}
        </p>

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

      <div className="text-7xl font-mono mb-8">{formatTime()}</div>

      <div className="flex gap-4">
        <button
          onClick={async () => {
            if (!running) {
              if (!subject || !topic) {
                alert("Fill subject and topic first.");
                return;
              }

              setRunning(true);

              if (seconds === 0) {
                await createEvent("start");
              }
            } else {
              setRunning(false);
            }
          }}
          className={`px-6 py-3 rounded-xl font-semibold ${
            running ? "bg-yellow-500" : "bg-green-500"
          }`}
        >
          {running ? "Pause" : "Start"}
        </button>

        <button
          onClick={async () => {
            setRunning(false);
            await createEvent("end", seconds);
            await saveSession();
          }}
          className="bg-red-500 px-6 py-3 rounded-xl font-semibold"
        >
          Stop & Save
        </button>

        <button
          onClick={() => {
            setRunning(false);
            setSeconds(0);
            setSubject("");
            setTopic("");
          }}
          className="bg-gray-500 px-6 py-3 rounded-xl font-semibold"
        >
          Reset
        </button>
      </div>
    </main>
  );
}