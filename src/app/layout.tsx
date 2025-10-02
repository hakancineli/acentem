import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import TenantSwitcher from "@/components/TenantSwitcher";
import NavLink from "@/components/NavLink";
import { prisma } from "@/lib/prisma";
import type { ModuleKey } from "@/lib/types";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yönetim Paneli",
  description: "Çoklu tenant destekli yönetim arayüzü",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAuthenticated = Boolean(cookieStore.get("auth-token")?.value);
  const role = cookieStore.get("role")?.value;
  const tenantId = cookieStore.get("tenant-id")?.value || null;

  // Aktif tenant için modül görünürlüğü
  let moduleVisibility: Record<ModuleKey, boolean> = {
    dashboard: true,
    otel: true,
    tur: true,
    transfer: true,
    ucak: true,
    saglik: true,
    muhasebe: true,
    arac: true,
    vip_yat: true,
    cruise: true,
    emlak: true,
    reports: true,
    users: true,
  };
  if (tenantId) {
    const settings = await prisma.moduleSetting.findMany({ where: { tenantId } });
    const merged: Record<string, boolean> = {};
    for (const s of settings) merged[s.key as string] = Boolean(s.enabled);
    moduleVisibility = {
      dashboard: merged.dashboard ?? true,
      otel: merged.otel ?? true,
      tur: merged.tur ?? true,
      transfer: merged.transfer ?? true,
      ucak: merged.ucak ?? true,
      saglik: merged.saglik ?? true,
      muhasebe: merged.muhasebe ?? true,
      arac: merged.arac ?? true,
      vip_yat: merged.vip_yat ?? true,
      cruise: merged.cruise ?? true,
      emlak: merged.emlak ?? true,
      reports: merged.reports ?? true,
      users: merged.users ?? true,
    } as Record<ModuleKey, boolean>;
  }
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <div className="min-h-screen grid grid-cols-[260px_1fr] grid-rows-[64px_1fr]">
          <aside className="row-span-2 bg-gradient-to-b from-slate-400 to-slate-500 dark:from-slate-800 dark:to-slate-900 border-r border-slate-600 dark:border-slate-700 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Acentem</div>
            </div>
            <nav className="flex flex-col gap-1">
              <NavLink href="/">
                <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Ana sayfa
              </NavLink>
              {moduleVisibility.dashboard && (
                <NavLink href="/dashboard">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dashboard
                </NavLink>
              )}
              {!isAuthenticated && (
                <NavLink href="/login">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Giriş
                </NavLink>
              )}
              {role === "admin" && (
                <NavLink href="/admin">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </NavLink>
              )}
              {role === "super" && (
                <NavLink href="/super">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Super
                </NavLink>
              )}
              <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>
              <NavLink href="/rezervasyonlar">
                <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
                Tüm Rezervasyonlar
              </NavLink>
              {moduleVisibility.otel && (
                <NavLink href="/otel">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Otel
                </NavLink>
              )}
              {moduleVisibility.tur && (
                <NavLink href="/tur">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Tur
                </NavLink>
              )}
              {moduleVisibility.transfer && (
                <NavLink href="/transfer">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Transfer
                </NavLink>
              )}
              {moduleVisibility.ucak && (
                <NavLink href="/ucak">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Uçak
                </NavLink>
              )}
              {moduleVisibility.saglik && (
                <NavLink href="/saglik">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Sağlık
                </NavLink>
              )}
              {moduleVisibility.arac && (
                <NavLink href="/arac">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  Araç Kiralama
                </NavLink>
              )}
              {moduleVisibility.vip_yat && (
                <NavLink href="/vip-yat">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Vip Yat
                </NavLink>
              )}
              {moduleVisibility.cruise && (
                <NavLink href="/cruise">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Cruise
                </NavLink>
              )}
              {moduleVisibility.emlak && (
                <NavLink href="/emlak">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Emlak
                </NavLink>
              )}
              {moduleVisibility.muhasebe && (
                <NavLink href="/muhasebe">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Muhasebe
                </NavLink>
              )}
              <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>
              {moduleVisibility.reports && (
                <NavLink href="/reports">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Raporlar
                </NavLink>
              )}
              {moduleVisibility.users && (
                <NavLink href="/users">
                  <svg className="module-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Kullanıcılar
                </NavLink>
              )}
            </nav>
          </aside>
          <header className="col-start-2 h-[64px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm">
            <div className="font-semibold text-lg text-slate-800 dark:text-slate-200">
              Turizm Yönetim Paneli
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated && <TenantSwitcher />}
              {isAuthenticated ? (
                <form action="/api/logout" method="post">
                  <button className="modern-button-secondary" formMethod="post">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Çıkış
                  </button>
                </form>
              ) : (
                <Link href="/login" className="modern-button">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Giriş
                </Link>
              )}
              <ThemeToggle />
            </div>
          </header>
          <main className="col-start-2 p-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
