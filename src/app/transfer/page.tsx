import Link from "next/link";
import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export default async function TransferPage() {
  const { allowed } = await assertModuleEnabled("transfer");
  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Transfer Modülü</h1>
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

  // Transfer istatistikleri
  const [transfers, bookings, pendingBookings, totalRevenue] = await Promise.all([
    prisma.transfer.count({ where: { tenantId } }),
    prisma.transferBooking.count({ where: { tenantId } }),
    prisma.transferBooking.count({ where: { tenantId, status: "pending" } }),
    prisma.transferBooking.aggregate({
      where: { tenantId, status: "confirmed" },
      _sum: { totalAmount: true }
    })
  ]);

  // Son rezervasyonlar
  const recentBookings = await prisma.transferBooking.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // Aktif transfer araçları
  const activeTransfers = await prisma.transfer.findMany({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 3
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Transfer Modülü</h1>
          <p className="text-slate-600 dark:text-slate-400">Araç rezervasyon ve yönetim sistemi</p>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-number">{transfers}</div>
          <div className="stat-label">Toplam Araç</div>
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
              <Link href="/transfer/rezervasyonlar" className="modern-button-secondary text-sm">Tümünü Gör</Link>
            </div>
            <div className="space-y-4">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="modern-card-gradient p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{booking.customerName}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {booking.pickupLocation} → {booking.dropoffLocation}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.pickupDate.toLocaleDateString("tr-TR")} {booking.pickupDate.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
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
                          <span className="text-xs text-slate-500">Transfer Rezervasyonu</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">₺{booking.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">{booking.passengers} yolcu</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <p>Henüz rezervasyon bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Transfer Araçları Bölümü */}
          <div className="modern-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Transfer Araçları</h3>
              <Link href="/transfer/araclar" className="modern-button text-sm">Araçları Yönet</Link>
            </div>
            <div className="space-y-3">
              {activeTransfers.length > 0 ? (
                activeTransfers.map((transfer) => (
                  <div key={transfer.id} className="modern-card-gradient p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-slate-200">{transfer.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{transfer.vehicleType}</p>
                        <p className="text-xs text-slate-500">{transfer.from} → {transfer.to}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">₺{transfer.price.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">{transfer.capacity} kişi</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                  <p className="text-sm">Henüz araç bulunmuyor</p>
                  <Link href="/transfer/araclar/yeni" className="modern-button-secondary text-sm mt-2 inline-block">İlk Aracı Ekle</Link>
                </div>
              )}
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Özellikler</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Araç yönetimi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Rezervasyon takibi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Şoför ataması</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Fiyat hesaplama</span>
              </div>
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <Link href="/transfer/araclar/yeni" className="w-full modern-button block text-center">Yeni Araç Ekle</Link>
              <Link href="/transfer/araclar" className="w-full modern-button-secondary block text-center">Araç Listesi</Link>
              <Link href="/transfer/rezervasyonlar" className="w-full modern-button-secondary block text-center">Rezervasyonlar</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}