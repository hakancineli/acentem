import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";

interface OtellerPageProps {
  searchParams: {
    page?: string;
    q?: string;
    limit?: string;
    sort?: string;
    dir?: string;
  };
}

export default async function OtellerPage({ searchParams }: OtellerPageProps) {
  const { allowed } = await assertModuleEnabled("otel");
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
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Otel Modülü Devre Dışı</h2>
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
        { name: { contains: q, mode: "insensitive" as const } },
        { location: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  // Get hotels with pagination
  const [hotels, totalCount] = await Promise.all([
    prisma.hotel.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { reservations: true },
        },
      },
    }),
    prisma.hotel.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Otel Listesi</h1>
          <p className="text-slate-600 dark:text-slate-400">Tüm otelleri yönetin</p>
        </div>
        <Link href="/otel/oteller/yeni" className="modern-button">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni Otel
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="stat-number">{totalCount}</div>
          <div className="stat-label">Toplam Otel</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {hotels.filter(hotel => hotel.isActive).length}
          </div>
          <div className="stat-label">Aktif Oteller</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {hotels.reduce((sum, hotel) => sum + hotel._count.reservations, 0)}
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
              placeholder="Otel adı veya konum ara..."
              defaultValue={q}
              className="modern-input w-full"
            />
          </div>
          <div className="flex gap-2">
            <select name="sort" defaultValue={sort} className="modern-input">
              <option value="createdAt">Tarih</option>
              <option value="name">Ad</option>
              <option value="starRating">Yıldız</option>
              <option value="location">Konum</option>
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

      {/* Hotels List */}
      <div className="modern-card p-6">
        {hotels.length > 0 ? (
          <div className="space-y-4">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="modern-card-gradient p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {hotel.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        hotel.isActive 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      }`}>
                        {hotel.isActive ? "Aktif" : "Pasif"}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < hotel.starRating 
                                ? "text-yellow-400" 
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Konum:</span> {hotel.location}
                      </div>
                      <div>
                        <span className="font-medium">Yıldız:</span> {hotel.starRating} yıldız
                      </div>
                    </div>
                    {hotel.amenities && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Olanaklar:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {JSON.parse(hotel.amenities).map((amenity: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-500">
                      <span>Rezervasyon: {hotel._count.reservations}</span>
                      <span>Oluşturulma: {hotel.createdAt.toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link 
                      href={`/otel/oteller/${hotel.id}`}
                      className="modern-button-secondary text-sm"
                    >
                      Düzenle
                    </Link>
                    <Link 
                      href={`/otel/rezervasyonlar?hotel=${hotel.id}`}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Otel Bulunamadı</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {q ? "Arama kriterlerinize uygun otel bulunamadı." : "Henüz otel eklenmemiş."}
            </p>
            {!q && (
              <Link href="/otel/oteller/yeni" className="modern-button">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                İlk Oteli Ekle
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

