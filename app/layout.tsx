import type { Metadata } from "next";
import { Suspense } from "react";
import AuthGuard from "@/components/guards";
import AppShell from "@/components/AppShell";
import LockScreen from "@/app/components/LockScreen";
import { LockProvider } from "@/contexts/LockContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unlimit PC House",
  description: "Shop Manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading...</div>}>
          <LockProvider>
            <AuthGuard>
              <AppShell>{children}</AppShell>
            </AuthGuard>
            <LockScreen />
          </LockProvider>
        </Suspense>
      </body>
    </html>
  );
}