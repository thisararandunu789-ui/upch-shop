"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const LockContext = createContext(null);

export const LOCK_STATE_KEY = "upch_lock_state";
export const ACTIVITY_KEY = "upch_last_activity";

// ⏰ Settings: 15 mins idle -> lock. 1 min before -> warning
export const IDLE_TIMEOUT = 3 * 60 * 1000;
export const WARNING_TIME = 1 * 60 * 1000;

const PUBLIC_PATHS = ["/login", "/check", "/store"];

export function LockProvider({ children }) {
  const pathname = usePathname();
  const [locked, setLocked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(0);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Load User
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email || "");
        supabase.from("user_roles").select("display_name").eq("user_id", session.user.id).maybeSingle().then(({ data }) => {
          setUserName(data?.display_name || session.user.email?.split("@")[0] || "User");
        });
      }
    });
  }, []);

  // Timer Logic (Bulletproof)
  useEffect(() => {
    if (isPublic) return;

    let interval;
    const checkIdle = () => {
      const last = Number(localStorage.getItem(ACTIVITY_KEY)) || Date.now();
      const idleFor = Date.now() - last;

      if (idleFor >= IDLE_TIMEOUT) {
        setLocked(true);
        setShowWarning(false);
        localStorage.setItem(LOCK_STATE_KEY, "locked");
      } else if (idleFor >= (IDLE_TIMEOUT - WARNING_TIME)) {
        setShowWarning(true);
        setMinutesLeft(Math.ceil((IDLE_TIMEOUT - idleFor) / 60000));
      } else {
        setShowWarning(false);
      }
    };

    const recordActivity = () => {
      if (document.visibilityState === "visible" && !locked) {
        localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, recordActivity, { passive: true }));
    
    // තත්පර 5න් 5ට check කරනවා
    interval = setInterval(checkIdle, 5000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, recordActivity));
      clearInterval(interval);
    };
  }, [isPublic, locked]);

  const lock = () => { setLocked(true); localStorage.setItem(LOCK_STATE_KEY, "locked"); };
  const unlock = () => { setLocked(false); setShowWarning(false); localStorage.setItem(LOCK_STATE_KEY, "unlocked"); localStorage.setItem(ACTIVITY_KEY, Date.now().toString()); };

  return (
    <LockContext.Provider value={{ locked, lock, unlock, userEmail, userName, showWarning, minutesLeft, isPublic }}>
      {children}
    </LockContext.Provider>
  );
}

export function useLock() {
  return useContext(LockContext);
}