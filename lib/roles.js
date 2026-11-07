"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export const PAGE_ACCESS = {
  "/": ["owner", "staff"],
  "/products": ["owner", "staff"],
  "/inventory": ["owner", "staff"],
  "/lookup": ["owner", "staff"],
  "/billing": ["owner", "staff"],
  "/sales": ["owner", "staff"],
  "/warranty": ["owner", "staff"],
  "/contacts": ["owner", "staff"],
  "/service": ["owner", "staff"],
  "/trade-in": ["owner", "staff"],
  "/reports": ["owner"],
  "/system": ["owner"],
};

export function canAccess(role, pathname) {
  if (!role) return false;
  if (PAGE_ACCESS[pathname]) return PAGE_ACCESS[pathname].includes(role);
  for (const path of Object.keys(PAGE_ACCESS)) {
    if (path !== "/" && pathname.startsWith(path + "/")) return PAGE_ACCESS[path].includes(role);
  }
  return true; // Default to true for sub-pages
}

export function useUserRole() {
  const [state, setState] = useState({ role: null, loading: true });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return setState({ role: null, loading: false });

      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle();
      if (mounted) setState({ role: data?.role || "staff", loading: false });
    };
    load();
    return () => { mounted = false; };
  }, []);

  return state;
}