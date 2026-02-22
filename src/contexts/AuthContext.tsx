"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  UserProfile,
  LoginForm,
  RegisterForm,
  RoleName,
  RoleScope,
} from "@/lib/types";
import { authApi, getTokens, setTokens, clearTokens } from "@/lib/api";
import { toast } from "@/lib/toast";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginForm) => Promise<boolean>;
  register: (data: RegisterForm) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  hasRole: (
    role: RoleName,
    scope?: RoleScope,
    tenantId?: number,
    branchId?: number,
  ) => boolean;
  isSuperAdmin: boolean;
  getTenantId: () => number | null;
  getBranchId: () => number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      const tokens = getTokens();
      if (tokens?.accessToken) {
        try {
          const userData = await authApi.me();
          setUser(userData);
        } catch {
          clearTokens();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (data: LoginForm): Promise<boolean> => {
    const response = await toast.promise(authApi.login(data), {
      loading: "Iniciando sesión...",
      success: (res) =>
        `¡Bienvenido, ${res.user.firstName || res.user.email}!`,
      error: "Error al iniciar sesión",
    });
    setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
    setUser(response.user);
    return true;
  }, []);


  const register = useCallback(async (data: RegisterForm): Promise<boolean> => {
    try {
      await toast.promise(authApi.register(data), {
        loading: "Creando cuenta...",
        success: "¡Cuenta creada! Revisa tu email para verificar tu cuenta.",
        error: "Error al registrarse",
      });

      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    const id = toast.loading("Cerrando sesión...");
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      toast.dismiss(id);
      clearTokens();
      setUser(null);
      toast.success("Sesión cerrada");
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const tokens = getTokens();
    if (!tokens?.refreshToken) return false;

    try {
      const response = await authApi.refresh(tokens.refreshToken);
      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || tokens.refreshToken,
      });
      const userData = await authApi.me();
      setUser(userData);
      return true;
    } catch {
      clearTokens();
      setUser(null);
      return false;
    }
  }, []);

  const hasRole = useCallback(
    (
      role: RoleName,
      scope?: RoleScope,
      tenantId?: number,
      branchId?: number,
    ): boolean => {
      if (!user?.roles) return false;

      return user.roles.some((userRole) => {
        // Check role name - backend sends roleName directly
        const roleName = userRole.roleName || userRole.role?.name;
        if (roleName !== role) return false;

        // If no scope specified, just check role name
        if (!scope) return true;

        // Check scope
        if (userRole.scope !== scope) return false;

        // For tenant scope, check tenantId
        if (scope === RoleScope.TENANT && tenantId) {
          return userRole.tenantId === tenantId;
        }

        // For branch scope, check branchId
        if (scope === RoleScope.BRANCH && branchId) {
          return userRole.branchId === branchId;
        }

        return true;
      });
    },
    [user],
  );

  const isSuperAdmin =
    user?.roles?.some((r) => {
      const roleName = r.roleName || r.role?.name;
      return roleName === RoleName.SUPER_ADMIN;
    }) ?? false;

  const getTenantId = useCallback((): number | null => {
    if (!user?.roles) return null;
    const tenantRole = user.roles.find(
      (r) => r.scope === RoleScope.TENANT || r.scope === RoleScope.BRANCH,
    );
    return tenantRole?.tenantId ?? null;
  }, [user]);

  const getBranchId = useCallback((): number | null => {
    if (!user?.roles) return null;
    const branchRole = user.roles.find((r) => r.scope === RoleScope.BRANCH);
    return branchRole?.branchId ?? null;
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshSession,
    hasRole,
    isSuperAdmin,
    getTenantId,
    getBranchId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
