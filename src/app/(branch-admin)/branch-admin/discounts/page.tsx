"use client";

import { useEffect, useState } from "react";
import { DiscountManager } from "@/components/pages/DiscountManager";
import { useAuth } from "@/contexts/AuthContext";
import { RoleName } from "@/lib/types";
import { Skeleton } from "@/components/ui";

export default function BranchDiscountsPage() {
  const { user } = useAuth();
  const [branchId, setBranchId] = useState<number | null>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.roles) {
      const adminRole = user.roles.find((r) => r.roleName === RoleName.BRANCH_ADMIN);
      if (adminRole?.branchId && adminRole.tenant?.tenantId) {
        setBranchId(adminRole.branchId);
        setTenantId(adminRole.tenant.tenantId);
      } else if (adminRole?.branchId) {
          // If tenantId doesn't bubble up in the role, fallback to fetching or we assume branch is enough (API uses branch context)
          setBranchId(adminRole.branchId);
      }
    }
  }, [user]);

  if (!branchId) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  // Notice we pass tenantId = 0 if we somehow don't have it, since backend determines tenantId via branchId if scoped properly.
  // Actually we need to make sure we query by branch if we are branch admin.
  return (
    <DiscountManager 
      tenantId={tenantId || 0}
      branchId={branchId}
      title="Mis Promociones"
      description="Atrae más reservas ofreciendo descuentos especiales en tu sucursal." 
    />
  );
}
