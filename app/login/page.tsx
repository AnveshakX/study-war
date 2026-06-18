"use client";

import { useState } from "react";
import supabase from "@/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const signUp = async () => {
    if (!username || !email || !password) {
      alert("Fill all fields.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      const { error: usernameError } = await supabase
        .from("usernames")
        .insert([
          {
            email,
            username,
          },
        ]);

      if (usernameError) {
        alert("Username already taken.");
        return;
      }

      alert("Signup successful. Check email.");
    }
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Login successful!");
      router.push("/timer");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-5xl font-bold mb-8">Login 🔐</h1>

      <div className="flex flex-col gap-4 w-80">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-3 rounded-lg bg-white text-black"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 rounded-lg bg-white text-black"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 rounded-lg bg-white text-black"
        />

        <button
          onClick={signUp}
          className="bg-blue-500 px-6 py-3 rounded-xl"
        >
          Sign Up
        </button>

        <button
          onClick={signIn}
          className="bg-green-500 px-6 py-3 rounded-xl"
        >
          Login
        </button>
      </div>
    </main>
  );
}