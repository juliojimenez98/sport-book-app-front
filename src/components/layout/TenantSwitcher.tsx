"use client";

import { useTenantSwitcher } from "@/contexts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantSwitcherProps {
  className?: string;
  isCollapsed?: boolean;
}

export function TenantSwitcher({ className, isCollapsed }: TenantSwitcherProps) {
  const { tenantOptions, selectedTenantId, setSelectedTenantId, isInitialized } =
    useTenantSwitcher();

  if (!isInitialized || tenantOptions.length === 0) return null;

  // If only 1 tenant, render just the name instead of a dropdown
  if (tenantOptions.length === 1) {
    if (isCollapsed) return null;
    return (
      <div className={cn("flex flex-col", className)}>
         <span className="font-semibold text-sm truncate">
           Admin Centro
         </span>
         <span className="text-xs text-muted-foreground truncate">
            {tenantOptions[0].name}
         </span>
      </div>
    );
  }

  // Find the currently selected tenant name or fallback to a placeholder
  const selectedTenant = tenantOptions.find(
    (t) => t.tenantId === selectedTenantId
  );
  
  if (isCollapsed) {
     return (
        <div className={cn("flex justify-center", className)}>
           <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
     );
  }

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      <label className="text-xs font-medium text-muted-foreground">
        Centro Deportivo
      </label>
      <Select
        value={selectedTenantId ? selectedTenantId.toString() : undefined}
        onValueChange={(value) => setSelectedTenantId(parseInt(value, 10))}
      >
        <SelectTrigger className="w-full h-8 px-2 text-xs truncate">
          <SelectValue placeholder="Seleccionar Centro" />
        </SelectTrigger>
        <SelectContent>
          {tenantOptions.map((tenant) => (
            <SelectItem 
              key={tenant.tenantId} 
              value={tenant.tenantId.toString()}
              className="text-xs cursor-pointer truncate"
            >
              {tenant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
