"use client";
export const instant = false; // 🆕 මේක එකතු කරන්න

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLock } from "@/contexts/LockContext";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const { locked, lock } = useLock(); // LockContext එකෙන් lock function එක ගන්නවා

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email || "User");
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    if (!confirm("Logout කරන්නද?")) return;
    await supabase.auth.signOut();
    localStorage.removeItem("upch_last_activity"); // Timer එක reset කරන්න
    window.location.href = "/login";
  };

  if (loading) return <div className="p-10 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-gray-900 border border-gray-800 p-4 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-white">💻 UNLIMIT PC HOUSE</h1>
          <p className="text-sm text-gray-400 mt-1">Logged in as: <span className="text-blue-400">{email}</span></p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => lock()} 
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-medium text-sm transition"
          >
            🔒 Lock Screen
          </button>
          <button 
            onClick={handleLogout} 
            className="bg-red-600/20 text-red-400 border border-red-900/50 hover:bg-red-600/30 px-4 py-2 rounded font-medium text-sm transition"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-blue-900/40 to-gray-900 border border-blue-800/50 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Welcome to your new Dashboard! 🎉</h2>
        <p className="text-gray-300 text-sm leading-relaxed max-w-2xl">
          ඔයාගේ අලුත් සයිට් එකේ ලොගින් එක, ලොක් ස්ක්‍රීන් එක සහ ආරක්ෂාව හරියටම වැඩ කරනවා. 
          දැන් අපිට පුළුවන් මේකට එකින් එක අපේ ප්‍රධාන ෆීචර්ස් (Billing, Inventory, ආදිය) එකතු කරන්න.
        </p>
      </div>

      {/* Dummy Stats for Visual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Sales", value: "Rs. 0", icon: "💰" },
          { label: "Active Jobs", value: "0", icon: "🔧" },
          { label: "Pending Orders", value: "0", icon: "🛒" },
          { label: "Low Stock", value: "0", icon: "📦" },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.icon} {stat.label}</p>
            <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

    </div>
  );
}