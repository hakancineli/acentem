import Link from "next/link";
import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export default async function OtelPage() {
  const { allowed } = await assertModuleEnabled("otel");
  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Otel Modülü</h1>
              <p className="text-slate-600 dark:text-slate-400">Erişim engellendi</p>
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">Bu modül mevcut tenant için kapalı.</div>
          <Link href="/admin" className="modern-button-secondary">Admin ekranına gidin</Link>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;

  // Otel istatistikleri
  const [hotels, reservations, pendingReservations, totalRevenue] = await Promise.all([
    prisma.hotel.count({ where: { tenantId } }),
    prisma.hotelReservation.count({ where: { tenantId } }),
    prisma.hotelReservation.count({ where: { tenantId, status: "pending" } }),
    prisma.hotelReservation.aggregate({
      where: { tenantId, status: "confirmed" },
      _sum: { totalAmount: true }
    })
  ]);

  // Son rezervasyonlar
  const recentReservations = await prisma.hotelReservation.findMany({
    where: { tenantId },
    include: { hotel: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Otel Modülü</h1>
          <p className="text-slate-600 dark:text-slate-400">Otel rezervasyon ve yönetim sistemi</p>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-number">{hotels}</div>
          <div className="stat-label">Toplam Otel</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{reservations}</div>
          <div className="stat-label">Toplam Rezervasyon</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{pendingReservations}</div>
          <div className="stat-label">Bekleyen Rezervasyon</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">₺{totalRevenue._sum.totalAmount?.toLocaleString() || 0}</div>
          <div className="stat-label">Toplam Gelir</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="modern-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Son Rezervasyonlar</h2>
              <Link href="/otel/rezervasyonlar" className="modern-button-secondary text-sm">Tümünü Gör</Link>
            </div>
            <div className="space-y-4">
              {recentReservations.length > 0 ? (
                recentReservations.map((reservation) => (
                  <div key={reservation.id} className="modern-card-gradient p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{reservation.hotel.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {reservation.guestName} • {reservation.checkIn.toLocaleDateString("tr-TR")} - {reservation.checkOut.toLocaleDateString("tr-TR")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reservation.status === "confirmed" ? "bg-green-100 text-green-800" :
                            reservation.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {reservation.status === "confirmed" ? "Onaylandı" :
                             reservation.status === "pending" ? "Beklemede" : "İptal"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">₺{reservation.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">{reservation.rooms} oda</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p>Henüz rezervasyon bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Özellikler</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Otel arama ve rezervasyon</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Fiyat karşılaştırma</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Müşteri yönetimi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Komisyon takibi</span>
              </div>
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <Link href="/otel/oteller/yeni" className="w-full modern-button block text-center">Yeni Otel</Link>
              <Link href="/otel/oteller" className="w-full modern-button-secondary block text-center">Otel Listesi</Link>
              <Link href="/otel/rezervasyonlar" className="w-full modern-button-secondary block text-center">Rezervasyonlar</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
