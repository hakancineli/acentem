import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";

interface SigortalarPageProps {
  searchParams: {
    page?: string;
    q?: string;
    limit?: string;
    sort?: string;
    dir?: string;
  };
}

export default async function SigortalarPage({ searchParams }: SigortalarPageProps) {
  const { allowed } = await assertModuleEnabled("saglik");
  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Sağlık Modülü Devre Dışı</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Bu modülü kullanmak için lütfen yöneticinizle iletişime geçin.</p>
            <Link href="/dashboard" className="modern-button">Ana Sayfaya Dön</Link>
          </div>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;

  if (!tenantId) {
    return <div>Tenant bulunamadı</div>;
  }

  // Search params
  const searchParamsResolved = await Promise.resolve(searchParams);
  const page = parseInt(searchParamsResolved.page || "1");
  const limit = parseInt(searchParamsResolved.limit || "10");
  const q = searchParamsResolved.q || "";
  const sort = searchParamsResolved.sort || "createdAt";
  const dir = searchParamsResolved.dir || "desc";

  // Build where clause
  const where = {
    tenantId,
    ...(q && {
      OR: [
        { provider: { contains: q, mode: "insensitive" as const } },
        { planName: { contains: q, mode: "insensitive" as const } },
        { coverage: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  // Get insurances with pagination
  const [insurances, totalCount] = await Promise.all([
    prisma.healthInsurance.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { policies: true },
        },
      },
    }),
    prisma.healthInsurance.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Sağlık Sigortaları</h1>
          <p className="text-slate-600 dark:text-slate-400">Tüm sağlık sigortalarını yönetin</p>
        </div>
        <Link href="/saglik/sigortalar/yeni" className="modern-button">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni Sigorta
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="stat-number">{totalCount}</div>
          <div className="stat-label">Toplam Sigorta</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {insurances.filter(insurance => insurance.isActive).length}
          </div>
          <div className="stat-label">Aktif Sigortalar</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {insurances.reduce((sum, insurance) => sum + insurance._count.policies, 0)}
          </div>
          <div className="stat-label">Toplam Poliçe</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="modern-card p-6">
        <form method="GET" className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              name="q"
              placeholder="Sağlayıcı, plan adı, kapsam ara..."
              defaultValue={q}
              className="modern-input w-full"
            />
          </div>
          <div className="flex gap-2">
            <select name="sort" defaultValue={sort} className="modern-input">
              <option value="createdAt">Tarih</option>
              <option value="provider">Sağlayıcı</option>
              <option value="planName">Plan Adı</option>
              <option value="price">Fiyat</option>
            </select>
            <select name="dir" defaultValue={dir} className="modern-input">
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select>
            <select name="limit" defaultValue={limit.toString()} className="modern-input">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <button type="submit" className="modern-button-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Ara
            </button>
          </div>
        </form>
      </div>

      {/* Insurances List */}
      <div className="modern-card p-6">
        {insurances.length > 0 ? (
          <div className="space-y-4">
            {insurances.map((insurance) => (
              <div key={insurance.id} className="modern-card-gradient p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {insurance.provider} - {insurance.planName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        insurance.isActive 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      }`}>
                        {insurance.isActive ? "Aktif" : "Pasif"}
                      </span>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Sağlık Sigortası</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Sağlayıcı:</span> {insurance.provider}
                      </div>
                      <div>
                        <span className="font-medium">Plan:</span> {insurance.planName}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Kapsam:</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{insurance.coverage}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-500">
                      <span>Poliçe: {insurance._count.policies}</span>
                      <span>Fiyat: ₺{insurance.price.toLocaleString()}</span>
                      <span>Oluşturulma: {insurance.createdAt.toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link 
                      href={`/saglik/sigortalar/${insurance.id}`}
                      className="modern-button-secondary text-sm"
                    >
                      Düzenle
                    </Link>
                    <Link 
                      href={`/saglik/policeler?insurance=${insurance.id}`}
                      className="modern-button text-sm"
                    >
                      Poliçeler
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Sigorta Bulunamadı</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {q ? "Arama kriterlerinize uygun sigorta bulunamadı." : "Henüz sigorta eklenmemiş."}
            </p>
            {!q && (
              <Link href="/saglik/sigortalar/yeni" className="modern-button">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                İlk Sigortayı Ekle
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
                href={`?${new URLSearchParams({ ...searchParamsResolved, page: (page - 1).toString() })}`}
                className="modern-button-secondary"
              >
                Önceki
              </Link>
            )}
            {page < totalPages && (
              <Link 
                href={`?${new URLSearchParams({ ...searchParamsResolved, page: (page + 1).toString() })}`}
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

