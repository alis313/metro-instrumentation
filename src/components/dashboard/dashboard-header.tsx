"use client";

import * as React from "react";
import { Moon, Sun, Bell, Download, Train, ShieldCheck, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

interface HeaderProps {
  activeAlerts: number;
  onToggleAlerts: () => void;
}

export function DashboardHeader({
  activeAlerts,
  onToggleAlerts,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { user, logout } = useAuth();
  React.useEffect(() => setMounted(true), []);

  return (
    <header className="hero-bg dark sticky top-0 z-40 border-b border-border/60">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Train className="h-5 w-5" strokeWidth={2.5} />
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
            </span>
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-extrabold sm:text-lg">
              سامانه پایش ابزار دقیق خط مترو
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Metro Line Instrumentation Monitoring System
            </p>
          </div>
        </div>

        {/* Spacer (search bar removed) */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="ms-auto flex items-center gap-2">
          {/* Live badge */}
          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 backdrop-blur sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              پایش زنده
            </span>
          </div>

          {/* Admin panel button - only visible to admins */}
          {user?.role === "ADMIN" && (
            <a href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-border/50 bg-card/50 backdrop-blur"
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">پنل مدیریت</span>
              </Button>
            </a>
          )}

          {/* Alerts */}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAlerts}
            className="relative gap-1.5 border-border/50 bg-card/50 backdrop-blur"
            aria-label="هشدارها"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">هشدارها</span>
            {activeAlerts > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white tnum glow-alarm">
                {activeAlerts}
              </span>
            )}
          </Button>

          {/* User menu / logout */}
          {user && (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user.displayName}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={logout}
                className="border-border/50 bg-card/50 backdrop-blur"
                aria-label="خروج"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="border-border/50 bg-card/50 backdrop-blur"
            aria-label="تغییر تم"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
