"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, FileSpreadsheet, Activity, Image as ImageIcon, Train, LogOut,
  Home, ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function AdminHome() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">در حال بارگذاری…</div>;
  }
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div>
          <p>برای دسترسی به این بخش لطفاً وارد شوید</p>
          <Link href="/login" className="mt-4 inline-block text-primary underline">ورود</Link>
        </div>
      </div>
    );
  }
  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div>
          <p>دسترسی به بخش مدیریت فقط برای مدیران مجاز است</p>
          <Link href="/" className="mt-4 inline-block text-primary underline">بازگشت به داشبورد</Link>
        </div>
      </div>
    );
  }

  const cards = [
    { href: "/admin/users", icon: Users, title: "مدیریت کاربران", desc: "تعریف کاربران مشاهده‌گر، تعیین دسترسی به ایستگاه‌ها" },
    { href: "/admin/data-sources", icon: FileSpreadsheet, title: "منابع داده", desc: "آپلود فایل اکسل، تحلیل ساختار، پیکربندی شیت‌ها" },
    { href: "/admin/stations", icon: Train, title: "مدیریت ایستگاه‌ها", desc: "تعریف ایستگاه‌ها و کد اختصاری آنها" },
    { href: "/admin/inclinometers", icon: ImageIcon, title: "عکس‌های اینکلاینومتر", desc: "آپلود عکس برای هر ابزار اینکلاینومتر" },
    { href: "/admin/activity", icon: Activity, title: "لاگ فعالیت", desc: "تاریخچه ورود و فعالیت کاربران" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">پنل مدیریت</h1>
              <p className="text-sm text-muted-foreground">سامانه پایش ابزار دقیق مترو</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/"><Button variant="outline" size="sm" className="gap-1.5"><Home className="h-4 w-4" /> داشبورد</Button></Link>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={logout}><LogOut className="h-4 w-4" /> خروج</Button>
          </div>
        </div>

        {/* User info */}
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-muted-foreground">کاربر فعلی</p>
              <p className="text-lg font-semibold">{user.displayName}</p>
              <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
            </div>
            <div className="text-left text-xs text-muted-foreground">
              {user.lastLoginAt ? <p>آخرین ورود: {new Date(user.lastLoginAt).toLocaleString("fa-IR")}</p> : null}
            </div>
          </CardContent>
        </Card>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.href} href={c.href}>
              <Card className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <c.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{c.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
