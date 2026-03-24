"use client";

import { DiscountManager } from "@/components/pages/DiscountManager";
import { useTenantSwitcher } from "@/contexts";
import { Skeleton } from "@/components/ui";

export default function BranchDiscountsPage() {
  const { selectedBranchId, selectedTenantId } = useTenantSwitcher();

  if (!selectedBranchId) {
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
      tenantId={selectedTenantId || 0}
      branchId={selectedBranchId}
      title="Mis Promociones"
      description="Atrae más reservas ofreciendo descuentos especiales en tu sucursal." 
    />
  );
}
