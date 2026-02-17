"use client";

import { RequireAuth, RequireRole } from "@/components/auth";
import { SuperAdminSidebar } from "@/components/layout";
import { RoleName } from "@/lib/types";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <RequireRole roles={[RoleName.SUPER_ADMIN]}>
        <div className="min-h-screen">
          <SuperAdminSidebar />
          <main className="pl-64 transition-all duration-300">
            <div className="p-8">{children}</div>
          </main>
        </div>
      </RequireRole>
    </RequireAuth>
  );
}
