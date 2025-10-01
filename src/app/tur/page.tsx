import Link from "next/link";
import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export default async function TurPage() {
  const { allowed } = await assertModuleEnabled("tur");
  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Tur Modülü</h1>
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

  // Tur istatistikleri
  const [tours, bookings, pendingBookings, totalRevenue] = await Promise.all([
    prisma.tour.count({ where: { tenantId } }),
    prisma.tourBooking.count({ where: { tenantId } }),
    prisma.tourBooking.count({ where: { tenantId, status: "pending" } }),
    prisma.tourBooking.aggregate({
      where: { tenantId, status: "confirmed" },
      _sum: { totalAmount: true }
    })
  ]);

  // Son rezervasyonlar
  const recentBookings = await prisma.tourBooking.findMany({
    where: { tenantId },
    include: { tour: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // Aktif tur paketleri
  const activeTours = await prisma.tour.findMany({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 3
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Tur Modülü</h1>
          <p className="text-slate-600 dark:text-slate-400">Tur paket yönetim sistemi</p>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-number">{tours}</div>
          <div className="stat-label">Toplam Tur Paketi</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{bookings}</div>
          <div className="stat-label">Toplam Rezervasyon</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{pendingBookings}</div>
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
              <Link href="/tur/rezervasyonlar" className="modern-button-secondary text-sm">Tümünü Gör</Link>
            </div>
            <div className="space-y-4">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="modern-card-gradient p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{booking.tour.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {booking.customerName} • {booking.startDate.toLocaleDateString("tr-TR")} • {booking.participants} kişi
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                            booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {booking.status === "confirmed" ? "Onaylandı" :
                             booking.status === "pending" ? "Beklemede" : "İptal"}
                          </span>
                          <span className="text-xs text-slate-500">{booking.tour.destination}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">₺{booking.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">{booking.tour.duration} gün</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p>Henüz rezervasyon bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Aktif Tur Paketleri</h3>
            <div className="space-y-3">
              {activeTours.length > 0 ? (
                activeTours.map((tour) => (
                  <div key={tour.id} className="modern-card-gradient p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-slate-200">{tour.name}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{tour.destination} • {tour.duration} gün</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">₺{tour.price.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                  <p className="text-sm">Henüz tur paketi yok</p>
                </div>
              )}
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Özellikler</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Tur paketi oluşturma</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Rezervasyon yönetimi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Fiyat hesaplama</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Katılımcı takibi</span>
              </div>
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <Link href="/tur/turlar/yeni" className="w-full modern-button block text-center">Yeni Tur Paketi</Link>
              <Link href="/tur/turlar" className="w-full modern-button-secondary block text-center">Tur Listesi</Link>
              <Link href="/tur/rezervasyonlar" className="w-full modern-button-secondary block text-center">Rezervasyonlar</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}