"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, FileEdit, Home, LogOut, Map, FileText, Users, Settings, PlusCircle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/lib/app-context"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, logout, user } = useAppContext()

  // Define routes based on user role
  const commonRoutes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Map View",
      icon: Map,
      href: "/map",
      active: pathname === "/map",
    },
    {
      label: "Beneficiaries",
      icon: Users,
      href: "/beneficiaries",
      active: pathname.startsWith("/beneficiaries") && !pathname.includes("/manage"),
    },
    {
      label: "Reports",
      icon: FileText,
      href: "/reports",
      active: pathname === "/reports",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/analytics",
      active: pathname === "/analytics",
    },
  ]

  // Admin specific routes
  const adminRoutes = [
    {
      label: "Admin Panel",
      icon: ShieldCheck,
      href: "/admin",
      active: pathname.startsWith("/admin"),
    },
  ]

  // Officer and Admin shared routes
  const managementRoutes = [
    {
      label: "Manage Data",
      icon: FileEdit,
      href: "/manage",
      active: pathname === "/manage",
    },
    {
      label: "Add Beneficiary",
      icon: PlusCircle,
      href: "/manage/add",
      active: pathname === "/manage/add",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      active: pathname === "/settings",
    },
  ]

  // Combine routes based on user role
  let routes = [...commonRoutes]
  
  // Add admin panel for admin users only
  if (user?.role === "admin") {
    routes = [...routes, ...adminRoutes]
  }
  
  // Add management routes for both admin and officers
  if (user?.role === "admin" || user?.role === "officer") {
    routes = [...routes, ...managementRoutes]
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-background transition-transform duration-300 md:relative",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16",
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        <h2
          className={cn("text-lg font-semibold transition-opacity", isOpen ? "opacity-100" : "opacity-0 md:opacity-0")}
        >
          SGAY GIS-MIS
        </h2>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {routes.map((route) => (
            <Link key={route.href} href={route.href} passHref>
              <Button
                variant={route.active ? "secondary" : "ghost"}
                className={cn("justify-start gap-3 h-10", !isOpen && "md:justify-center md:px-2")}
                asChild
              >
                <div>
                  <route.icon className={cn("h-5 w-5", route.active ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm", !isOpen && "md:hidden")}>{route.label}</span>
                </div>
              </Button>
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        {/* <div className={cn("mb-2 flex items-center gap-2", !isOpen && "md:hidden")}>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
          {/* <div>
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div> }
        </div> */}
        <Button
          variant="ghost"
          className={cn("justify-start gap-3 w-full", !isOpen && "md:justify-center md:px-2")}
          onClick={logout}
        >
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <span className={cn("text-sm", !isOpen && "md:hidden")}>Logout</span>
        </Button>
      </div>
    </aside>
  )
}

