"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo
} from "react";
import { RoleName, RoleScope, UserRole } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { branchesApi } from "@/lib/api";

interface TenantOption {
  tenantId: number;
  name: string;
}

interface BranchOption {
  branchId: number;
  tenantId: number;
  name: string;
}

interface TenantSwitcherContextType {
  // Tenant state
  selectedTenantId: number | null;
  setSelectedTenantId: (id: number) => void;
  tenantOptions: TenantOption[];
  
  // Branch state
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number) => void;
  branchOptions: BranchOption[];
  
  // Helpers
  isInitialized: boolean;
}

const TenantSwitcherContext = createContext<TenantSwitcherContextType | undefined>(undefined);

const TENANT_STORAGE_KEY = "esb_selected_tenant";
const BRANCH_STORAGE_KEY = "esb_selected_branch";

export function TenantSwitcherProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [selectedTenantId, _setSelectedTenantId] = useState<number | null>(null);
  const [selectedBranchId, _setSelectedBranchId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fetchedBranches, setFetchedBranches] = useState<BranchOption[]>([]);

  // Fetch branches for TENANT_ADMIN or SUPER_ADMIN
  useEffect(() => {
    if (!isAuthenticated || !selectedTenantId || !user) {
      setFetchedBranches([]);
      return;
    }

    const isTenantAdmin = user.roles?.some(
      (r) =>
        (r.roleName === RoleName.TENANT_ADMIN && r.tenantId === selectedTenantId) ||
        r.roleName === RoleName.SUPER_ADMIN
    );

    if (isTenantAdmin) {
      branchesApi.list({ tenantId: selectedTenantId })
        .then((data) => {
          setFetchedBranches(
            data.map((b) => ({
              branchId: b.branchId,
              tenantId: b.tenantId,
              name: b.name,
            }))
          );
        })
        .catch(console.error);
    } else {
      setFetchedBranches([]);
    }
  }, [isAuthenticated, selectedTenantId, user]);

  // Compute all available tenants where user has TENANT_ADMIN or SUPER_ADMIN access
  // For SUPER_ADMIN this is tricky as they have access to all, but the backend doesn't embed all tenants.
  // Generally, they should pick a tenant. For simplicity, we extract from roles.
  // Since SUPER_ADMIN has global scope, we might not have tenant options in roles.
  // For now, we extract all unique tenants explicitly assigned in roles.
  const tenantOptions = useMemo(() => {
    if (!user?.roles) return [];
    
    const uniqueTenants = new Map<number, TenantOption>();
    
    user.roles.forEach((ur: UserRole) => {
      const roleName = ur.roleName || ur.role?.name;
      // If they are explicitly assigned to a tenant
      if (
        (roleName === RoleName.TENANT_ADMIN || roleName === RoleName.SUPER_ADMIN) && 
        ur.tenantId && 
        ur.tenant // Backend includes tenant info? 
      ) {
        if (!uniqueTenants.has(ur.tenantId)) {
          uniqueTenants.set(ur.tenantId, {
            tenantId: ur.tenantId,
            name: ur.tenant?.name || `Centro Deportivo ${ur.tenantId}`
          });
        }
      } else if (ur.tenantId && !ur.tenant) {
         // Fallback if tenant name isn't populated
         if (!uniqueTenants.has(ur.tenantId)) {
            uniqueTenants.set(ur.tenantId, {
              tenantId: ur.tenantId,
              name: `Centro Deportivo ${ur.tenantId}`
            });
         }
      }
    });
    
    return Array.from(uniqueTenants.values());
  }, [user]);

  // Compute all available branches based on the selected tenant
  const branchOptions = useMemo(() => {
    if (!user?.roles) return [];
    
    const uniqueBranches = new Map<number, BranchOption>();
    
    user.roles.forEach((ur: UserRole) => {
      const roleName = ur.roleName || ur.role?.name;
      // We list branches they have explicitly been assigned to
      if (
        (roleName === RoleName.BRANCH_ADMIN || roleName === RoleName.STAFF) && 
        ur.branchId && 
        (!selectedTenantId || ur.tenantId === selectedTenantId)
      ) {
        if (!uniqueBranches.has(ur.branchId)) {
          uniqueBranches.set(ur.branchId, {
            branchId: ur.branchId,
            tenantId: ur.tenantId as number,
            name: ur.branch?.name || `Sucursal ${ur.branchId}`
          });
        }
      }
    });

    // Merge fetched branches for TENANT_ADMIN / SUPER_ADMIN
    fetchedBranches.forEach((b) => {
      if (!uniqueBranches.has(b.branchId)) {
        uniqueBranches.set(b.branchId, b);
      }
    });
    
    return Array.from(uniqueBranches.values());
  }, [user, selectedTenantId, fetchedBranches]);

  // Set selected ID with localStorage saving
  const setSelectedTenantId = useCallback((id: number) => {
    _setSelectedTenantId(id);
    localStorage.setItem(TENANT_STORAGE_KEY, id.toString());
    
    // When tenant changes, clear branch selection if it's not in the new tenant
    // We'll let the effect handle picking a new valid branch
  }, []);

  const setSelectedBranchId = useCallback((id: number) => {
    _setSelectedBranchId(id);
    localStorage.setItem(BRANCH_STORAGE_KEY, id.toString());
  }, []);

  // Initialization & sync with available options
  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      if (!isAuthenticated) {
        _setSelectedTenantId(null);
        _setSelectedBranchId(null);
        setIsInitialized(false);
      }
      return;
    }

    // Initialize Tenant
    let currentTenantId = selectedTenantId;
    
    if (!currentTenantId) {
      const stored = localStorage.getItem(TENANT_STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        // Only use stored if it's still a valid option
        if (tenantOptions.find(t => t.tenantId === parsed)) {
          currentTenantId = parsed;
        }
      }
    }

    // Default to first available if nothing valid is selected/stored
    if (!currentTenantId && tenantOptions.length > 0) {
      currentTenantId = tenantOptions[0].tenantId;
    }

    if (currentTenantId !== selectedTenantId) {
      _setSelectedTenantId(currentTenantId);
      if (currentTenantId) {
         localStorage.setItem(TENANT_STORAGE_KEY, currentTenantId.toString());
      }
    }

    // Initialize Branch
    let currentBranchId = selectedBranchId;

    if (!currentBranchId) {
      const stored = localStorage.getItem(BRANCH_STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        // We evaluate validity on next render when branchOptions is updated based on new selectedTenantId
        // but for now, if it matches ANY branch they have, keep it
        currentBranchId = parsed;
      }
    }

    if (currentBranchId && currentTenantId) {
      // Cross-check: is this branch actually in the selected tenant?
      // Since branchOptions updates reactively, we do a quick check against user roles
      const branchRole = user?.roles?.find(r => r.branchId === currentBranchId);
      if (branchRole && branchRole.tenantId !== currentTenantId) {
         // Invalid! Branch belongs to a different tenant.
         currentBranchId = null;
      }
    }

    // Default to first available branch if nothing valid is selected/stored
    if (!currentBranchId && branchOptions.length > 0) {
      currentBranchId = branchOptions[0].branchId;
    }

    if (currentBranchId !== selectedBranchId) {
      _setSelectedBranchId(currentBranchId);
      if (currentBranchId) {
         localStorage.setItem(BRANCH_STORAGE_KEY, currentBranchId.toString());
      }
    }

    setIsInitialized(true);

  }, [
    isAuthenticated, 
    isLoading, 
    tenantOptions, 
    branchOptions, 
    selectedTenantId, 
    selectedBranchId, 
    user
  ]);

  const value: TenantSwitcherContextType = {
    selectedTenantId,
    setSelectedTenantId,
    tenantOptions,
    
    selectedBranchId,
    setSelectedBranchId,
    branchOptions,
    
    isInitialized
  };

  return (
    <TenantSwitcherContext.Provider value={value}>
      {children}
    </TenantSwitcherContext.Provider>
  );
}

export function useTenantSwitcher() {
  const context = useContext(TenantSwitcherContext);
  if (context === undefined) {
    throw new Error("useTenantSwitcher must be used within a TenantSwitcherProvider");
  }
  return context;
}
