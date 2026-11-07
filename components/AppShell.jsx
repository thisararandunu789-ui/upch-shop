"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const NO_SIDEBAR_PATHS = ["/login", "/check", "/store"];

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const hideSidebar = NO_SIDEBAR_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (hideSidebar) return <main className="min-h-screen">{children}</main>;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-800 z-30 flex items-center justify-between px-4 print:hidden">
        <button onClick={() => setSidebarOpen(true)} className="text-white text-2xl w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded transition">
          ☰
        </button>
        <h2 className="text-base font-bold text-blue-400 truncate">💻 Shop Manager</h2>
        <div className="w-10" />
      </div>

      <div className="flex min-h-screen bg-gray-950">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 pt-14 md:pt-0 min-h-screen">
          {children}
        </main>
      </div>
    </>
  );
}