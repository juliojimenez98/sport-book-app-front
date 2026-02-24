"use client";

import { useEffect, useState } from "react";
import { DiscountManager } from "@/components/pages/DiscountManager";
import { useAuth } from "@/contexts/AuthContext";
import { RoleName } from "@/lib/types";
import { Skeleton } from "@/components/ui";

export default function TenantDiscountsPage() {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.roles) {
      const adminRole = user.roles.find((r) => r.roleName === RoleName.TENANT_ADMIN);
      if (adminRole?.tenantId) {
        setTenantId(adminRole.tenantId);
      }
    }
  }, [user]);

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <DiscountManager 
      tenantId={tenantId} 
      title="Descuentos de la Organización"
      description="Crea promociones y reglas de descuento para todas o para sucursales específicas." 
    />
  );
}
