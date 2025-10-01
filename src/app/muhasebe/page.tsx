import Link from "next/link";
import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export default async function MuhasebePage() {
  const { allowed } = await assertModuleEnabled("muhasebe");
  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Muhasebe Modülü</h1>
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

  // Muhasebe istatistikleri - tüm modüllerden toplam
  const [
    totalRevenue,
    totalExpenses,
    netProfit,
    monthlyRevenue
  ] = await Promise.all([
    // Toplam gelir (tüm modüllerden)
    Promise.all([
      prisma.hotelReservation.aggregate({
        where: { tenantId, status: "confirmed" },
        _sum: { totalAmount: true }
      }),
      prisma.tourBooking.aggregate({
        where: { tenantId, status: "confirmed" },
        _sum: { totalAmount: true }
      }),
      prisma.transferBooking.aggregate({
        where: { tenantId, status: "confirmed" },
        _sum: { totalAmount: true }
      }),
      prisma.flightBooking.aggregate({
        where: { tenantId, status: "confirmed" },
        _sum: { totalAmount: true }
      }),
      prisma.healthPolicy.aggregate({
        where: { tenantId, status: "active" },
        _sum: { premium: true }
      })
    ]).then(results => {
      const total = results.reduce((sum, result) => sum + (result._sum.totalAmount || result._sum.premium || 0), 0);
      return total;
    }),
    
    // Toplam gider (tahsilat tablosundan)
    prisma.collection.aggregate({
      where: { tenantId },
      _sum: { amount: true }
    }).then(result => result._sum.amount || 0),
    
    // Net kar hesaplama
    Promise.all([
      prisma.hotelReservation.aggregate({
        where: { tenantId, status: "confirmed" },
        _sum: { totalAmount: true }
      }),
      prisma.tourBooking.aggregate({
        where: { tenantId, status: "confirmed" },
        _sum: { totalAmount: true }
      }),
      prisma.transferBooking.aggregate({
        where: { tenantId, status: "confirmed" },
        _sum: { totalAmount: true }
      }),
      prisma.flightBooking.aggregate({
        where: { tenantId, status: "confirmed" },
        _sum: { totalAmount: true }
      }),
      prisma.healthPolicy.aggregate({
        where: { tenantId, status: "active" },
        _sum: { premium: true }
      }),
      prisma.collection.aggregate({
        where: { tenantId },
        _sum: { amount: true }
      })
    ]).then(results => {
      const revenue = results.slice(0, 5).reduce((sum, result) => sum + (result._sum.totalAmount || result._sum.premium || 0), 0);
      const expenses = results[5]._sum.amount || 0;
      return revenue - expenses;
    }),
    
    // Bu ayın geliri
    Promise.all([
      prisma.hotelReservation.aggregate({
        where: { 
          tenantId, 
          status: "confirmed",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { totalAmount: true }
      }),
      prisma.tourBooking.aggregate({
        where: { 
          tenantId, 
          status: "confirmed",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { totalAmount: true }
      }),
      prisma.transferBooking.aggregate({
        where: { 
          tenantId, 
          status: "confirmed",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { totalAmount: true }
      }),
      prisma.flightBooking.aggregate({
        where: { 
          tenantId, 
          status: "confirmed",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { totalAmount: true }
      }),
      prisma.healthPolicy.aggregate({
        where: { 
          tenantId, 
          status: "active",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { premium: true }
      })
    ]).then(results => {
      return results.reduce((sum, result) => sum + (result._sum.totalAmount || result._sum.premium || 0), 0);
    })
  ]);

  // Son işlemler
  const recentCollections = await prisma.collection.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Muhasebe Modülü</h1>
          <p className="text-slate-600 dark:text-slate-400">Finansal yönetim ve raporlama sistemi</p>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-number">₺{totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Toplam Gelir</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">₺{totalExpenses.toLocaleString()}</div>
          <div className="stat-label">Toplam Gider</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">₺{netProfit.toLocaleString()}</div>
          <div className="stat-label">Net Kar</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">₺{monthlyRevenue.toLocaleString()}</div>
          <div className="stat-label">Bu Ay Gelir</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="modern-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Son Tahsilatlar</h2>
              <Link href="/muhasebe/tahsilatlar" className="modern-button-secondary text-sm">Tümünü Gör</Link>
            </div>
            <div className="space-y-4">
              {recentCollections.length > 0 ? (
                recentCollections.map((collection) => (
                  <div key={collection.id} className="modern-card-gradient p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Tahsilat</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {collection.note || "Açıklama yok"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {collection.createdAt.toLocaleDateString("tr-TR")} {collection.createdAt.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₺{collection.amount.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">Tahsilat</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p>Henüz tahsilat bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Finansal Özet</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Otel Geliri</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">₺0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Tur Geliri</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">₺0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Transfer Geliri</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">₺0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Uçak Geliri</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">₺0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Sağlık Geliri</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">₺0</span>
              </div>
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Özellikler</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Gelir-gider takibi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Raporlama</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Mali analiz</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Bütçe yönetimi</span>
              </div>
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <Link href="/muhasebe/gelirler/yeni" className="w-full modern-button block text-center">Yeni Gelir</Link>
              <Link href="/muhasebe/gelirler" className="w-full modern-button-secondary block text-center">Gelirler</Link>
              <Link href="/muhasebe/giderler" className="w-full modern-button-secondary block text-center">Giderler</Link>
              <Link href="/muhasebe/raporlar" className="w-full modern-button-secondary block text-center">Raporlar</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}