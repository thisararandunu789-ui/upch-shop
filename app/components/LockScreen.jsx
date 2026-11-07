"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useLock } from "@/contexts/LockContext";

export default function LockScreen() {
  const { locked, unlock, userEmail, userName, isPublic } = useLock();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  
  // 🆕 Hydration Error එක හදන්න time එක null වලින් පටන් ගන්නවා
  const [time, setTime] = useState(null);
  const inputRef = useRef(null);

  // 🆕 Client එකේ load වුණාට පස්සේ විතරක් time එක set කරනවා
  useEffect(() => {
    setTime(new Date());
    
    if (!locked) return;
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [locked]);

  useEffect(() => {
    if (locked && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [locked]);

  if (isPublic || !locked) return null;

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) return setError("Password එක type කරන්න");
    
    setUnlocking(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });

    if (authError) {
      setError("❌ වැරදි password එකක්!");
      setPassword("");
      setUnlocking(false);
      return;
    }

    setPassword("");
    unlock();
    setUnlocking(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-md">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 text-center">
        
        {/* 🆕 time එක null නම් placeholders පෙන්නනවා */}
        <h2 className="text-5xl font-bold text-white mb-2">
          {time ? time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {time ? time.toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'long' }) : "Loading..."}
        </p>

        <div className="w-20 h-20 mx-auto rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center text-3xl mb-3">
          🔒
        </div>
        
        <p className="text-lg font-semibold text-white mb-1">Hi, {userName || "User"}!</p>
        <p className="text-xs text-gray-500 mb-6">Screen එක lock වෙලා තියෙනවා</p>

        <form onSubmit={handleUnlock} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Account Password"
            className="w-full bg-white text-black px-4 py-3 rounded-lg text-sm"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={unlocking || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white py-3 rounded-lg font-semibold"
          >
            {unlocking ? "Unlocking..." : "🔓 Unlock"}
          </button>
        </form>

      </div>
    </div>
  );
}