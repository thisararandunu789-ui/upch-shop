"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PUBLIC_PATHS = ["/login", "/check", "/store"];

export default function AuthGuard({ children }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session?.user) {
        if (!isPublic) router.replace("/login");
        setAuthed(false);
      } else {
        setAuthed(true);
      }
      setChecking(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        if (!isPublic) router.replace("/login");
        setAuthed(false);
      } else if (event === "SIGNED_IN") {
        setAuthed(true);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router, pathname, isPublic]);

  if (checking) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading...</div>;
  if (isPublic) return children;
  if (!authed) return null;

  return children;
}