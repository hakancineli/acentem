import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";

interface AraclarPageProps {
  searchParams: {
    page?: string;
    q?: string;
    limit?: string;
    sort?: string;
    dir?: string;
  };
}

export default async function AraclarPage({ searchParams }: AraclarPageProps) {
  const { allowed } = await assertModuleEnabled("transfer");
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
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Transfer Modülü Devre Dışı</h2>
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
        { vehicleType: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  // Get transfers with pagination
  const [transfers, totalCount] = await Promise.all([
    prisma.transfer.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transfer.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Transfer Araçları</h1>
          <p className="text-slate-600 dark:text-slate-400">Tüm transfer araçlarını yönetin</p>
        </div>
        <Link href="/transfer/araclar/yeni" className="modern-button">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni Araç
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="stat-number">{totalCount}</div>
          <div className="stat-label">Toplam Araç</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {transfers.filter(transfer => transfer.isActive).length}
          </div>
          <div className="stat-label">Aktif Araçlar</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {/* Rezervasyon ilişkisi kaldırıldığı için toplam rezervasyon gösterimi devre dışı */}
            0
          </div>
          <div className="stat-label">Toplam Rezervasyon</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="modern-card p-6">
        <form method="GET" className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              name="q"
              placeholder="Araç tipi ara..."
              defaultValue={q}
              className="modern-input w-full"
            />
          </div>
          <div className="flex gap-2">
            <select name="sort" defaultValue={sort} className="modern-input">
              <option value="createdAt">Tarih</option>
              <option value="vehicleType">Araç Tipi</option>
              <option value="capacity">Kapasite</option>
              <option value="pricePerKm">KM Fiyatı</option>
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

      {/* Transfers List */}
      <div className="modern-card p-6">
        {transfers.length > 0 ? (
          <div className="space-y-4">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="modern-card-gradient p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {transfer.vehicleType}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transfer.isActive 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      }`}>
                        {transfer.isActive ? "Aktif" : "Pasif"}
                      </span>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{transfer.capacity} kişi</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Kapasite:</span> {transfer.capacity} kişi
                      </div>
                      <div>
                        <span className="font-medium">KM Fiyatı:</span> ₺{transfer.pricePerKm}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-500">
                      {/* Rezervasyon sayısı kaldırıldı */}
                      <span>Rezervasyon: -</span>
                      <span>Oluşturulma: {transfer.createdAt.toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link 
                      href={`/transfer/araclar/${transfer.id}`}
                      className="modern-button-secondary text-sm"
                    >
                      Düzenle
                    </Link>
                    <Link 
                      href={`/transfer/rezervasyonlar?transfer=${transfer.id}`}
                      className="modern-button text-sm"
                    >
                      Rezervasyonlar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Araç Bulunamadı</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {q ? "Arama kriterlerinize uygun araç bulunamadı." : "Henüz araç eklenmemiş."}
            </p>
            {!q && (
              <Link href="/transfer/araclar/yeni" className="modern-button">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                İlk Aracı Ekle
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

