import Link from "next/link";
import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

interface SoforlerPageProps {
  searchParams: {
    q?: string;
    page?: string;
    sort?: string;
    dir?: string;
  };
}

export default async function SoforlerPage({ searchParams }: SoforlerPageProps) {
  const { allowed } = await assertModuleEnabled("transfer");
  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Şoför Yönetimi</h1>
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

  if (!tenantId) {
    return <div>Tenant bulunamadı</div>;
  }

  // Search and pagination
  const q = searchParams.q || "";
  const page = parseInt(searchParams.page || "1");
  const sort = searchParams.sort || "createdAt";
  const dir = searchParams.dir || "desc";
  const limit = 10;

  // Build where clause
  const where = {
    tenantId,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  // Get drivers with pagination
  const [drivers, totalCount] = await Promise.all([
    prisma.driver.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.driver.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Driver statistics
  const [activeDrivers, totalCommission] = await Promise.all([
    prisma.driver.count({ where: { tenantId, isActive: true } }),
    prisma.driver.aggregate({
      where: { tenantId },
      _avg: { commission: true }
    })
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Şoför Yönetimi</h1>
          <p className="text-slate-600 dark:text-slate-400">Transfer ve tur şoförlerini yönetin</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="stat-number">{drivers.length}</div>
          <div className="stat-label">Toplam Şoför</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{activeDrivers}</div>
          <div className="stat-label">Aktif Şoför</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">%{Math.round(totalCommission._avg.commission || 0)}</div>
          <div className="stat-label">Ortalama Komisyon</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/soforler/yeni" className="modern-button">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Yeni Şoför
          </Link>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <form method="GET" className="flex items-center gap-2">
            <input
              type="text"
              name="q"
              placeholder="Şoför ara..."
              defaultValue={q}
              className="modern-input"
            />
            <button type="submit" className="modern-button-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Drivers List */}
      <div className="modern-card">
        {drivers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-6 font-medium text-slate-600 dark:text-slate-400">Şoför</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600 dark:text-slate-400">Telefon</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600 dark:text-slate-400">Komisyon</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600 dark:text-slate-400">Durum</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600 dark:text-slate-400">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{driver.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{driver.phone}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        %{driver.commission}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        driver.isActive 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {driver.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/soforler/${driver.id}/duzenle`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Düzenle
                        </Link>
                        <Link 
                          href={`/soforler/${driver.id}`}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Detay
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Şoför Bulunamadı</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {q ? "Arama kriterlerinize uygun şoför bulunamadı." : "Henüz şoför eklenmemiş."}
            </p>
            {!q && (
              <Link href="/soforler/yeni" className="modern-button">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                İlk Şoförü Ekle
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Sayfa {page} / {totalPages} ({totalCount} toplam)
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link 
                href={`?${new URLSearchParams({ ...searchParams, page: (page - 1).toString() })}`}
                className="modern-button-secondary"
              >
                Önceki
              </Link>
            )}
            {page < totalPages && (
              <Link 
                href={`?${new URLSearchParams({ ...searchParams, page: (page + 1).toString() })}`}
                className="modern-button-secondary"
              >
                Sonraki
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
