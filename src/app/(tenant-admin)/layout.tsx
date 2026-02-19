"use client";

import { useState, useEffect } from "react";
import { RequireAuth, RequireRole } from "@/components/auth";
import { TenantAdminSidebar } from "@/components/layout";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";
import { RoleName, RoleScope, Tenant } from "@/lib/types";
import { useAuth } from "@/contexts";
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
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get tenant info from user's role
  const tenantRole = user?.roles?.find((r) => {
    const roleName = r.roleName || r.role?.name;
    return (
      roleName === RoleName.TENANT_ADMIN &&
      (r.scope === RoleScope.TENANT || r.tenantId)
    );
  });
  const tenantName = tenantRole?.tenant?.name;
  const tenantId = tenantRole?.tenantId;

  // Load full tenant data (including colors)
  useEffect(() => {
    if (tenantId) {
      tenantsApi
        .get(tenantId)
        .then((data) => setTenant(data))
        .catch(() => setTenant(null));
    }
  }, [tenantId]);

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
                  {tenant?.name || tenantName || "Panel"}
                </span>
              </div>
            </header>

            <TenantAdminSidebar 
              tenantName={tenant?.name || tenantName} 
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
