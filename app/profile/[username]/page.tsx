"use client";

import { useEffect, useState } from "react";
import supabase from "@/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type Props = {
  params: {
    username: string;
  };
};

export default function UserProfile({ params }: Props) {
  const username = decodeURIComponent(params.username);

  const [myUsername, setMyUsername] = useState("");
  const [dailyChartData, setDailyChartData] = useState<any[]>([]);
  const [subjectChartData, setSubjectChartData] = useState<any[]>([]);

  const [totalTime, setTotalTime] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [topSubject, setTopSubject] = useState("");
  const [topTopic, setTopTopic] = useState("");
  const [streak, setStreak] = useState(0);

  const [myWinChance, setMyWinChance] = useState(0);
  const [theirWinChance, setTheirWinChance] = useState(0);
  const [verdict, setVerdict] = useState("");

  useEffect(() => {
    fetchMyUser();
  }, []);

  useEffect(() => {
    if (myUsername) {
      fetchUserData();
    }
  }, [myUsername]);

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
    } else {
      setMyUsername(user.email.split("@")[0]); // fallback
    }
  }
};

  const fetchUserData = async () => {
    const { data: sessions } = await supabase
      .from("study_sessions")
.select("*")
.eq("is_running", false)
      .eq("username", username);

    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("username", username)
      .single();

    if (!sessions) return;

    setSessionCount(sessions.length);

    const total = sessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );

    setTotalTime(total);

    const subjectMap: Record<string, number> = {};
    const topicMap: Record<string, number> = {};

    sessions.forEach((session) => {
      subjectMap[session.subject] =
        (subjectMap[session.subject] || 0) + session.duration;

      topicMap[session.topic] =
        (topicMap[session.topic] || 0) + session.duration;
    });

    setTopSubject(
      Object.entries(subjectMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"
    );

    setTopTopic(
      Object.entries(topicMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"
    );

    if (streakData) {
      setStreak(streakData.streak);
    }

    await fetchComparisonCharts();
  };

  const calculatePrediction = async (
    mySessions: any[],
    theirSessions: any[]
  ) => {
    const myTotal = mySessions.reduce((sum, s) => sum + s.duration, 0);
    const theirTotal = theirSessions.reduce((sum, s) => sum + s.duration, 0);

    const { data: myStreak } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("username", myUsername)
      .single();

    const { data: theirStreak } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("username", username)
      .single();

    const myScore =
      myTotal * 0.5 +
      (myStreak?.streak || 0) * 1000 * 0.3 +
      mySessions.length * 500 * 0.2;

    const theirScore =
      theirTotal * 0.5 +
      (theirStreak?.streak || 0) * 1000 * 0.3 +
      theirSessions.length * 500 * 0.2;

    const totalScore = myScore + theirScore;

    if (totalScore === 0) {
      setMyWinChance(50);
      setTheirWinChance(50);
      setVerdict("No data yet. Battle begins now.");
      return;
    }

    const myChance = Math.round((myScore / totalScore) * 100);
    const theirChance = 100 - myChance;

    setMyWinChance(myChance);
    setTheirWinChance(theirChance);

    if (myChance > theirChance) {
      setVerdict("You are favored to win this week ⚔");
    } else if (theirChance > myChance) {
      setVerdict(`${username} is currently dominating 🔥`);
    } else {
      setVerdict("This battle is dead even.");
    }
  };

  const fetchComparisonCharts = async () => {
    const { data: mySessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("username", myUsername);

    const { data: theirSessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("username", username);

    if (!mySessions || !theirSessions) return;

    // Daily graph (last 7 days)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    const dailyData = days.map((day) => {
      const myTotal = mySessions
        .filter((s) => s.created_at.startsWith(day))
        .reduce((sum, s) => sum + s.duration, 0);

      const theirTotal = theirSessions
        .filter((s) => s.created_at.startsWith(day))
        .reduce((sum, s) => sum + s.duration, 0);

      return {
        day: day.slice(5),
        me: Math.floor(myTotal / 60),
        them: Math.floor(theirTotal / 60),
      };
    });

    setDailyChartData(dailyData);

    // Subject graph
    const subjects = Array.from(
      new Set([
        ...mySessions.map((s) => s.subject),
        ...theirSessions.map((s) => s.subject),
      ])
    );

    const subjectData = subjects.map((subject) => {
      const myTotal = mySessions
        .filter((s) => s.subject === subject)
        .reduce((sum, s) => sum + s.duration, 0);

      const theirTotal = theirSessions
        .filter((s) => s.subject === subject)
        .reduce((sum, s) => sum + s.duration, 0);

      return {
        subject,
        me: Math.floor(myTotal / 60),
        them: Math.floor(theirTotal / 60),
      };
    });

    setSubjectChartData(subjectData);

    await calculatePrediction(mySessions, theirSessions);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    return `${hrs}h ${mins}m`;
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-8 py-8">
      <div className="w-full max-w-5xl mx-auto bg-gray-900 rounded-2xl p-4 md:p-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 break-words">
          {username}
        </h1>

        <div className="space-y-4 text-lg mb-10">
          <p>⏳ Total Study Time: {formatTime(totalTime)}</p>
          <p>📚 Total Sessions: {sessionCount}</p>
          <p>🔥 Current Streak: {streak} days</p>
          <p>🏆 Strongest Subject: {topSubject}</p>
          <p>🎯 Most Studied Topic: {topTopic}</p>
        </div>

        <h2 className="text-2xl font-bold mb-4">
          Daily Battle Graph 📈
        </h2>

        <ResponsiveContainer width="100%" height={300}>
  <LineChart data={dailyChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="me" stroke="#00ff00" />
          <Line type="monotone" dataKey="them" stroke="#ff0000" />
        </LineChart>
        </ResponsiveContainer>

        <h2 className="text-2xl font-bold mt-12 mb-4">
          Subject Domination Graph 📚
        </h2>

        <ResponsiveContainer width="100%" height={300}>
  <LineChart data={subjectChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="subject" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="me" stroke="#00ff00" />
          <Line type="monotone" dataKey="them" stroke="#ff0000" />
        </LineChart>
</ResponsiveContainer>

        <div className="mt-12 bg-gray-800 p-6 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">
            Win Prediction Engine 🤖
          </h2>

          <p className="text-green-400 text-lg">
            You: {myWinChance}%
          </p>

          <p className="text-red-400 text-lg">
            Them: {theirWinChance}%
          </p>

          <p className="mt-4 text-yellow-300 font-semibold">
            {verdict}
          </p>
        </div>
      </div>
    </main>
  );
}