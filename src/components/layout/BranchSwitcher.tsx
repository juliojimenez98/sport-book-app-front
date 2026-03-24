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

interface BranchSwitcherProps {
  className?: string;
  isCollapsed?: boolean;
}

export function BranchSwitcher({ className, isCollapsed }: BranchSwitcherProps) {
  const { branchOptions, selectedBranchId, setSelectedBranchId, isInitialized } =
    useTenantSwitcher();

  if (!isInitialized || branchOptions.length === 0) return null;

  // If only 1 branch, render just the name instead of a dropdown
  if (branchOptions.length === 1) {
    if (isCollapsed) return null;
    return (
      <div className={cn("flex flex-col", className)}>
         <span className="font-semibold text-sm truncate">
           Admin Sucursal
         </span>
         <span className="text-xs text-muted-foreground truncate">
            {branchOptions[0].name}
         </span>
      </div>
    );
  }

  const selectedBranch = branchOptions.find(
    (b) => b.branchId === selectedBranchId
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
        Sucursal
      </label>
      <Select
        value={selectedBranchId ? selectedBranchId.toString() : undefined}
        onValueChange={(value) => setSelectedBranchId(parseInt(value, 10))}
      >
        <SelectTrigger className="w-full h-8 px-2 text-xs truncate">
          <SelectValue placeholder="Seleccionar Sucursal" />
        </SelectTrigger>
        <SelectContent>
          {branchOptions.map((branch) => (
            <SelectItem 
              key={branch.branchId} 
              value={branch.branchId.toString()}
              className="text-xs cursor-pointer truncate"
            >
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
