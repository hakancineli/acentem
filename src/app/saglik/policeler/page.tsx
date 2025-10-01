import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";

interface PolicelerPageProps {
  searchParams: {
    page?: string;
    q?: string;
    limit?: string;
    sort?: string;
    dir?: string;
    status?: string;
    insurance?: string;
  };
}

export default async function PolicelerPage({ searchParams }: PolicelerPageProps) {
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
  const status = searchParamsResolved.status || "";
  const insuranceId = searchParamsResolved.insurance || "";

  // Build where clause
  const where = {
    tenantId,
    ...(insuranceId && { insuranceId }),
    ...(status && { status }),
    ...(q && {
      OR: [
        { policyNumber: { contains: q, mode: "insensitive" as const } },
        { holderName: { contains: q, mode: "insensitive" as const } },
        { holderEmail: { contains: q, mode: "insensitive" as const } },
        { insurance: { provider: { contains: q, mode: "insensitive" as const } } },
        { insurance: { planName: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
  };

  // Get policies with pagination
  const [policies, totalCount, insurances] = await Promise.all([
    prisma.healthPolicy.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        insurance: true,
      },
    }),
    prisma.healthPolicy.count({ where }),
    prisma.healthInsurance.findMany({
      where: { tenantId },
      select: { id: true, provider: true, planName: true },
      orderBy: { provider: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Status counts
  const statusCounts = await Promise.all([
    prisma.healthPolicy.count({ where: { tenantId, status: "active" } }),
    prisma.healthPolicy.count({ where: { tenantId, status: "expired" } }),
    prisma.healthPolicy.count({ where: { tenantId, status: "cancelled" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Sağlık Poliçeleri</h1>
          <p className="text-slate-600 dark:text-slate-400">Tüm sağlık poliçelerini yönetin</p>
        </div>
        <Link href="/saglik/policeler/yeni" className="modern-button">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni Poliçe
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-number">{totalCount}</div>
          <div className="stat-label">Toplam Poliçe</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statusCounts[0]}</div>
          <div className="stat-label">Aktif</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statusCounts[1]}</div>
          <div className="stat-label">Süresi Dolmuş</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statusCounts[2]}</div>
          <div className="stat-label">İptal Edilen</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="modern-card p-6">
        <form method="GET" className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              name="q"
              placeholder="Poliçe no, sigortalı adı, email ara..."
              defaultValue={q}
              className="modern-input w-full"
            />
          </div>
          <div className="flex gap-2">
            <select name="insurance" defaultValue={insuranceId} className="modern-input">
              <option value="">Tüm Sigortalar</option>
              {insurances.map((insurance) => (
                <option key={insurance.id} value={insurance.id}>
                  {insurance.provider} - {insurance.planName}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={status} className="modern-input">
              <option value="">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="expired">Süresi Dolmuş</option>
              <option value="cancelled">İptal Edilen</option>
            </select>
            <select name="sort" defaultValue={sort} className="modern-input">
              <option value="createdAt">Tarih</option>
              <option value="holderName">Sigortalı</option>
              <option value="policyNumber">Poliçe No</option>
              <option value="premium">Prim</option>
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

      {/* Policies List */}
      <div className="modern-card p-6">
        {policies.length > 0 ? (
          <div className="space-y-4">
            {policies.map((policy) => (
              <div key={policy.id} className="modern-card-gradient p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {policy.holderName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        policy.status === "active" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : policy.status === "expired"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      }`}>
                        {policy.status === "active" ? "Aktif" :
                         policy.status === "expired" ? "Süresi Dolmuş" : "İptal"}
                      </span>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Sağlık Poliçesi</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Poliçe No:</span> {policy.policyNumber}
                      </div>
                      <div>
                        <span className="font-medium">Sigorta:</span> {policy.insurance.provider} - {policy.insurance.planName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {policy.holderEmail}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400 mt-2">
                      <div>
                        <span className="font-medium">Başlangıç:</span> {policy.startDate.toLocaleDateString("tr-TR")}
                      </div>
                      <div>
                        <span className="font-medium">Bitiş:</span> {policy.endDate.toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                    {policy.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        <span className="font-medium">Notlar:</span> {policy.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-500">
                      <span>Prim: ₺{policy.premium.toLocaleString()}</span>
                      <span>Oluşturulma: {policy.createdAt.toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link 
                      href={`/saglik/policeler/${policy.id}`}
                      className="modern-button-secondary text-sm"
                    >
                      Düzenle
                    </Link>
                    <Link 
                      href={`/saglik/sigortalar/${policy.insuranceId}`}
                      className="modern-button text-sm"
                    >
                      Sigorta Detayı
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Poliçe Bulunamadı</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {q || status || insuranceId ? "Arama kriterlerinize uygun poliçe bulunamadı." : "Henüz poliçe eklenmemiş."}
            </p>
            {!q && !status && !insuranceId && (
              <Link href="/saglik/policeler/yeni" className="modern-button">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                İlk Poliçeyi Ekle
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

