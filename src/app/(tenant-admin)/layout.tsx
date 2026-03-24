"use client";

import { useState, useEffect } from "react";
import { RequireAuth, RequireRole } from "@/components/auth";
import { TenantAdminSidebar, TenantSwitcher } from "@/components/layout";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";
import { RoleName, RoleScope, Tenant } from "@/lib/types";
import { useAuth, useTenantSwitcher } from "@/contexts";
import { tenantsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { selectedTenantId } = useTenantSwitcher();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load full tenant data (including colors)
  useEffect(() => {
    if (selectedTenantId) {
      tenantsApi
        .get(selectedTenantId)
        .then((data) => setTenant(data))
        .catch(() => setTenant(null));
    }
  }, [selectedTenantId]);
  return (
    <RequireAuth>
      <RequireRole roles={[RoleName.TENANT_ADMIN, RoleName.SUPER_ADMIN]}>
        <TenantThemeProvider tenant={tenant}>
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
                <span className="font-semibold text-lg truncate max-w-[200px]">
                  {tenant?.name || "Panel Centro Deportivo"}
                </span>
              </div>
            </header>

            <TenantAdminSidebar 
              tenantName={tenant?.name} 
              titleSlot={<TenantSwitcher isCollapsed={false} />}
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            />
            
            <main className="pl-0 md:pl-64 transition-all duration-300">
              <div className="p-4 md:p-8">{children}</div>
            </main>
          </div>
        </TenantThemeProvider>
      </RequireRole>
    </RequireAuth>
  );
}
