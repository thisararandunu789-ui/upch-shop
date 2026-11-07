"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUserRole, canAccess } from "@/lib/roles";
import { useLock } from "@/contexts/LockContext";

const MENU = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/inventory", label: "Inventory", icon: "📥", activePrefixes: ["/inventory", "/grn", "/stock-in", "/stock-out"] },
  { href: "/lookup", label: "Lookup", icon: "🔍" },
  { href: "/billing", label: "Billing", icon: "💰", activePrefixes: ["/billing", "/bill"] },
  { href: "/sales", label: "Sales", icon: "🛒", activePrefixes: ["/sales", "/quotations", "/builds", "/store-orders"] },
  { href: "/warranty", label: "Warranty", icon: "🛡️" },
  { href: "/contacts", label: "Contacts", icon: "👥", activePrefixes: ["/contacts", "/customers", "/suppliers"] },
  { href: "/service", label: "Service", icon: "🔧", activePrefixes: ["/service", "/service-jobs", "/service-bookings"] },
  { href: "/trade-in", label: "Trade-in", icon: "🔄" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/system", label: "System", icon: "⚙️" },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, loading } = useUserRole();
  const { lock } = useLock();
  const [logoUrl, setLogoUrl] = useState("/icons/icon-512.png");

  useEffect(() => {
    // Load logo from settings
    supabase.from("settings").select("logo_url").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url);
    });
  }, []);

  const isLinkActive = (item) => {
    if (pathname === item.href) return true;
    if (item.activePrefixes) return item.activePrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
    return item.href !== "/" && pathname.startsWith(item.href + "/");
  };

  const filteredMenu = loading ? [] : MENU.filter((item) => canAccess(role, item.href));

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    if (!confirm("Logout කරන්නද?")) return;
    await supabase.auth.signOut();
    localStorage.removeItem("upch_last_activity");
    window.location.href = "/login";
  };

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40 md:hidden" />}

      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-0 h-[100dvh] w-64 bg-gray-900 border-r border-gray-800
          flex flex-col overflow-hidden transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"} print:hidden
        `}
      >
        {/* Header */}
        <div className="px-4 py-5 border-b border-gray-800 shrink-0 relative flex flex-col items-center">
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
          <Link href="/" onClick={onClose} className="group flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 p-1 flex items-center justify-center shadow-lg">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" onError={(e) => { e.target.src = "/icons/icon-512.png"; }} />
            </div>
            <p className="text-white font-black text-sm text-center tracking-tight">UNLIMIT PC HOUSE</p>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {loading ? (
            <p className="text-center text-xs text-gray-500 mt-4">Loading menu...</p>
          ) : (
            filteredMenu.map((item) => {
              const active = isLinkActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    active ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })
          )}
        </nav>

        {/* Footer (Lock & Logout) */}
        <div className="p-3 border-t border-gray-800 shrink-0 space-y-2">
          <button
            onClick={() => lock()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-yellow-600/10 text-yellow-500 hover:bg-yellow-600/20 border border-yellow-900/30 transition text-sm font-medium"
          >
            🔒 Lock Screen
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-900/40 transition text-sm font-medium"
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}