"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { Button, Avatar, AvatarFallback, Badge } from "@/components/ui";
import {
  CalendarDays,
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { getInitials, cn } from "@/lib/utils";

interface AdminSidebarProps {
  navItems: {
    href: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[];
  title: string;
  subtitle?: string;
}

export function AdminSidebar({ navItems, title, subtitle }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <CalendarDays className="h-8 w-8 text-primary" />
              <span className="text-lg font-bold gradient-text">
                BookingPro
              </span>
            </Link>
          )}
          {isCollapsed && (
            <CalendarDays className="h-8 w-8 text-primary mx-auto" />
          )}
        </div>

        {/* Title Section */}
        {!isCollapsed && (
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold text-sm">{title}</h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isCollapsed && "justify-center px-2",
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t p-2">
          {/* Theme Toggle */}
          <div
            className={cn(
              "flex items-center mb-2",
              isCollapsed ? "justify-center" : "px-3",
            )}
          >
            <ThemeToggle />
          </div>

          {/* User Info */}
          {!isCollapsed ? (
            <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="w-full"
              onClick={logout}
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full mt-2", isCollapsed && "px-2")}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Colapsar
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}

// Pre-configured sidebars for different admin types
export function SuperAdminSidebar() {
  const navItems = [
    { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/super-admin/tenants",
      label: "Centros Deportivos",
      icon: Building2,
    },
    { href: "/super-admin/users", label: "Usuarios", icon: Users },
    { href: "/super-admin/sports", label: "Deportes", icon: Activity },
    { href: "/super-admin/settings", label: "Configuración", icon: Settings },
  ];

  return (
    <AdminSidebar
      navItems={navItems}
      title="Super Admin"
      subtitle="Administración global"
    />
  );
}

export function TenantAdminSidebar({ tenantName }: { tenantName?: string }) {
  const navItems = [
    { href: "/tenant-admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tenant-admin/branches", label: "Sucursales", icon: Building2 },
    { href: "/tenant-admin/users", label: "Usuarios", icon: Users },
    { href: "/tenant-admin/settings", label: "Configuración", icon: Settings },
  ];

  return (
    <AdminSidebar
      navItems={navItems}
      title="Admin Centro Deportivo"
      subtitle={tenantName}
    />
  );
}

export function BranchAdminSidebar({ branchName }: { branchName?: string }) {
  const navItems = [
    { href: "/branch-admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/branch-admin/calendar", label: "Calendario", icon: CalendarDays },
    { href: "/branch-admin/resources", label: "Canchas", icon: Activity },
    { href: "/branch-admin/hours", label: "Horarios", icon: Clock },
    { href: "/branch-admin/settings", label: "Configuración", icon: Settings },
  ];

  return (
    <AdminSidebar
      navItems={navItems}
      title="Admin Sucursal"
      subtitle={branchName}
    />
  );
}
