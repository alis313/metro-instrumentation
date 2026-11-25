import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "پایش ابزار دقیق مترو | Metro Instrumentation Monitoring",
  description:
    "داشبورد پایش نتایج ابزار دقیق پروژه مترو - اکستنسومتر، اینکلاینومتر، تیلت‌متر، چاه مشاهده‌ای و درزسنج در هر ایستگاه",
  keywords: [
    "ابزار دقیق",
    "مترو",
    "اکستنسومتر",
    "اینکلاینومتر",
    "تیلت‌متر",
    "چاه مشاهده‌ای",
    "درزسنج",
    "Instrumentation",
    "Metro",
    "Monitoring",
  ],
  authors: [{ name: "Instrumentation Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
