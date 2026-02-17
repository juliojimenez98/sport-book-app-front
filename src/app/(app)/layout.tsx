"use client";

import { RequireAuth } from "@/components/auth";
import { AppNavbar } from "@/components/layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen flex flex-col">
        <AppNavbar />
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      </div>
    </RequireAuth>
  );
}
