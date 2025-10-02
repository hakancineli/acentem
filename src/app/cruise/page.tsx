import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CruisePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const tenant = await prisma.tenant.findFirst({
    where: { users: { some: { email: session.user.email } } },
  });

  if (!tenant) redirect("/login");

  const [cruiseCount, bookingCount, totalRevenue] = await Promise.all([
    prisma.cruise.count({ where: { tenantId: tenant.id } }),
    prisma.cruiseBooking.count({ where: { tenantId: tenant.id } }),
    prisma.transaction.aggregate({
      where: { tenantId: tenant.id, type: "income", category: "cruise" },
      _sum: { amount: true }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          🚢 Cruise Modülü
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Toplam Cruise</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{cruiseCount}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400">🚢</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Toplam Rezervasyon</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{bookingCount}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Toplam Gelir</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                ₺{(totalRevenue._sum.amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 dark:text-emerald-400">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Aktif Cruise</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {cruiseCount}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400">⚓</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Özellikler
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>• Cruise paket yönetimi</li>
            <li>• Rezervasyon takibi</li>
            <li>• Müşteri bilgileri</li>
            <li>• Fiyatlandırma</li>
            <li>• Güzergah planlama</li>
            <li>• Durum takibi</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Hızlı İşlemler
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/cruise/cruiseler/yeni"
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yeni Cruise Ekle
            </Link>
            <Link
              href="/cruise/cruiseler"
              className="flex items-center justify-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cruise Listesi
            </Link>
            <Link
              href="/cruise/rezervasyonlar"
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Rezervasyonlar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
