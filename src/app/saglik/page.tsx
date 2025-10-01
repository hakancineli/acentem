import Link from "next/link";
import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export default async function SaglikPage() {
  const { allowed } = await assertModuleEnabled("saglik");
  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Sağlık Modülü</h1>
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

  // Sağlık istatistikleri
  const [insurances, policies, activePolicies, totalRevenue] = await Promise.all([
    prisma.healthInsurance.count({ where: { tenantId } }),
    prisma.healthPolicy.count({ where: { tenantId } }),
    prisma.healthPolicy.count({ where: { tenantId, status: "active" } }),
    prisma.healthPolicy.aggregate({
      where: { tenantId, status: "active" },
      _sum: { totalAmount: true }
    })
  ]);

  // Son poliçeler
  const recentPolicies = await prisma.healthPolicy.findMany({
    where: { tenantId },
    include: { insurance: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // Aktif sigortalar
  const activeInsurances = await prisma.healthInsurance.findMany({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 3
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Sağlık Modülü</h1>
          <p className="text-slate-600 dark:text-slate-400">Seyahat sigortası yönetim sistemi</p>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-number">{insurances}</div>
          <div className="stat-label">Toplam Sigorta</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{policies}</div>
          <div className="stat-label">Toplam Poliçe</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{activePolicies}</div>
          <div className="stat-label">Aktif Poliçe</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">₺{totalRevenue._sum.totalAmount?.toLocaleString() || 0}</div>
          <div className="stat-label">Toplam Prim</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="modern-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Son Poliçeler</h2>
              <Link href="/saglik/policeler" className="modern-button-secondary text-sm">Tümünü Gör</Link>
            </div>
            <div className="space-y-4">
              {recentPolicies.length > 0 ? (
                recentPolicies.map((policy) => (
                  <div key={policy.id} className="modern-card-gradient p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{policy.customerName}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {policy.insurance.provider} - {policy.insurance.planName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {policy.startDate.toLocaleDateString("tr-TR")} - {policy.endDate.toLocaleDateString("tr-TR")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            policy.status === "active" ? "bg-green-100 text-green-800" :
                            policy.status === "expired" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {policy.status === "active" ? "Aktif" :
                             policy.status === "expired" ? "Süresi Dolmuş" : "İptal"}
                          </span>
                          <span className="text-xs text-slate-500">{policy.insurance.coverage}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-pink-600 dark:text-pink-400">₺{policy.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">{policy.id.slice(-8)}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p>Henüz poliçe bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Aktif Sigortalar</h3>
            <div className="space-y-3">
              {activeInsurances.length > 0 ? (
                activeInsurances.map((insurance) => (
                  <div key={insurance.id} className="modern-card-gradient p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-slate-200">{insurance.provider}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{insurance.planName}</p>
                        <p className="text-xs text-slate-500">{insurance.coverage}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-pink-600 dark:text-pink-400">₺{insurance.price.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                  <p className="text-sm">Henüz sigorta yok</p>
                </div>
              )}
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Özellikler</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Sigorta yönetimi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Poliçe takibi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Prim hesaplama</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Kapsam yönetimi</span>
              </div>
            </div>
          </div>

          <div className="modern-card p-6">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <Link href="/saglik/sigortalar/yeni" className="w-full modern-button block text-center">Yeni Sigorta</Link>
              <Link href="/saglik/sigortalar" className="w-full modern-button-secondary block text-center">Sigorta Listesi</Link>
              <Link href="/saglik/policeler" className="w-full modern-button-secondary block text-center">Poliçeler</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}