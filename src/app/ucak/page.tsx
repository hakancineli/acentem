import Link from "next/link";
import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export default async function UcakPage() {
  const { allowed } = await assertModuleEnabled("ucak");
  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Uçak Modülü</h1>
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

  // Uçak istatistikleri
  const [flights, bookings, pendingBookings, totalRevenue] = await Promise.all([
    prisma.flight.count({ where: { tenantId } }),
    prisma.flightBooking.count({ where: { tenantId } }),
    prisma.flightBooking.count({ where: { tenantId, status: "pending" } }),
    prisma.flightBooking.aggregate({
      where: { tenantId, status: "confirmed" },
      _sum: { totalAmount: true }
    })
  ]);

  // Son rezervasyonlar
  const recentBookings = await prisma.flightBooking.findMany({
    where: { tenantId },
    include: { flight: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // Aktif uçuşlar
  const activeFlights = await prisma.flight.findMany({
    where: { tenantId, isActive: true },
    orderBy: { departure: "asc" },
    take: 3
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Uçak Modülü</h1>
          <p className="text-slate-600 dark:text-slate-400">Bilet rezervasyon ve yönetim sistemi</p>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-number">{flights}</div>
          <div className="stat-label">Toplam Uçuş</div>
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
              <Link href="/ucak/rezervasyonlar" className="modern-button-secondary text-sm">Tümünü Gör</Link>
            </div>
            <div className="space-y-4">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="modern-card-gradient p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{booking.passengerName}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {booking.flight.airline} {booking.flight.flightNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.flight.departure} → {booking.flight.arrival}
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
                          <span className="text-xs text-slate-500 capitalize">{booking.seatClass}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-sky-600 dark:text-sky-400">₺{booking.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">
                          {booking.flight.departure.toLocaleDateString("tr-TR")} {booking.flight.departure.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <p>Henüz rezervasyon bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Yaklaşan Uçuşlar</h3>
            <div className="space-y-3">
              {activeFlights.length > 0 ? (
                activeFlights.map((flight) => (
                  <div key={flight.id} className="modern-card-gradient p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-slate-200">{flight.airline} {flight.flightNumber}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{flight.from} → {flight.to}</p>
                        <p className="text-xs text-slate-500">
                          {flight.departure.toLocaleDateString("tr-TR")} {flight.departure.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-sky-600 dark:text-sky-400">₺{flight.price.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                  <p className="text-sm">Henüz uçuş yok</p>
                </div>
              )}
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Özellikler</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Uçuş yönetimi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Bilet rezervasyonu</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Koltuk seçimi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Fiyat takibi</span>
              </div>
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <Link href="/ucak/ucuslar/yeni" className="w-full modern-button block text-center">Yeni Uçuş</Link>
              <Link href="/ucak/ucuslar" className="w-full modern-button-secondary block text-center">Uçuş Listesi</Link>
              <Link href="/ucak/rezervasyonlar" className="w-full modern-button-secondary block text-center">Rezervasyonlar</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}