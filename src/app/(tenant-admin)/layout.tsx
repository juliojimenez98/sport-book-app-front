"use client";

import { useState, useEffect } from "react";
import { RequireAuth, RequireRole } from "@/components/auth";
import { TenantAdminSidebar } from "@/components/layout";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";
import { RoleName, RoleScope, Tenant } from "@/lib/types";
import { useAuth } from "@/contexts";
import { tenantsApi } from "@/lib/api";

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);

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
          <div className="min-h-screen">
            <TenantAdminSidebar tenantName={tenant?.name || tenantName} />
            <main className="pl-64 transition-all duration-300">
              <div className="p-8">{children}</div>
            </main>
          </div>
        </TenantThemeProvider>
      </RequireRole>
    </RequireAuth>
  );
}
