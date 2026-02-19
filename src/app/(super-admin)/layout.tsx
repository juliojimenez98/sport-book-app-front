"use client";

import { RequireAuth, RequireRole } from "@/components/auth";
import { SuperAdminSidebar } from "@/components/layout";
import { RoleName } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <RequireAuth>
      <RequireRole roles={[RoleName.SUPER_ADMIN]}>
        <div className="min-h-screen bg-background">
          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <span className="font-semibold text-lg">
                Super Admin
              </span>
            </div>
          </header>

          <SuperAdminSidebar 
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />
          
          <main className="pl-0 md:pl-64 transition-all duration-300">
            <div className="p-4 md:p-8">{children}</div>
          </main>
        </div>
      </RequireRole>
    </RequireAuth>
  );
}
