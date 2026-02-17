"use client";

import { useState, useEffect } from "react";
import { RequireAuth, RequireRole } from "@/components/auth";
import { BranchAdminSidebar } from "@/components/layout";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";
import { RoleName, RoleScope, Tenant } from "@/lib/types";
import { useAuth } from "@/contexts";
import { tenantsApi } from "@/lib/api";

export default function BranchAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Get branch info from user's role
  const branchRole = user?.roles?.find((r) => {
    const roleName = r.roleName || r.role?.name;
    return (
      (roleName === RoleName.BRANCH_ADMIN || roleName === RoleName.STAFF) &&
      (r.scope === RoleScope.BRANCH || r.branchId)
    );
  });
  const branchName = branchRole?.branch?.name;
  const tenantId = branchRole?.tenantId;

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
      <RequireRole
        roles={[
          RoleName.BRANCH_ADMIN,
          RoleName.STAFF,
          RoleName.TENANT_ADMIN,
          RoleName.SUPER_ADMIN,
        ]}
      >
        <TenantThemeProvider tenant={tenant}>
          <div className="min-h-screen">
            <BranchAdminSidebar branchName={branchName} />
            <main className="pl-64 transition-all duration-300">
              <div className="p-8">{children}</div>
            </main>
          </div>
        </TenantThemeProvider>
      </RequireRole>
    </RequireAuth>
  );
}
