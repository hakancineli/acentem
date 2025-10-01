import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";

interface GiderlerPageProps {
  searchParams: {
    page?: string;
    q?: string;
    limit?: string;
    sort?: string;
    dir?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export default async function GiderlerPage({ searchParams }: GiderlerPageProps) {
  const { allowed } = await assertModuleEnabled("muhasebe");
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
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Muhasebe Modülü Devre Dışı</h2>
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
  const category = searchParamsResolved.category || "";
  const dateFrom = searchParamsResolved.dateFrom || "";
  const dateTo = searchParamsResolved.dateTo || "";

  // Build where clause
  const where = {
    tenantId,
    type: "expense" as const,
    ...(category && { category }),
    ...(q && {
      OR: [
        { description: { contains: q, mode: "insensitive" as const } },
        { source: { contains: q, mode: "insensitive" as const } },
        { reference: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(dateFrom && dateTo && {
      date: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    }),
  };

  // Get expense transactions with pagination
  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Calculate totals
  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Giderler</h1>
          <p className="text-slate-600 dark:text-slate-400">Tüm gider işlemlerini yönetin</p>
        </div>
        <Link href="/muhasebe/giderler/yeni" className="modern-button">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni Gider
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-number">{totalCount}</div>
          <div className="stat-label">Toplam İşlem</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">₺{totalAmount.toLocaleString()}</div>
          <div className="stat-label">Toplam Gider</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {transactions.filter(t => t.status === "completed").length}
          </div>
          <div className="stat-label">Tamamlanan</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {transactions.filter(t => t.status === "pending").length}
          </div>
          <div className="stat-label">Bekleyen</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="modern-card p-6">
        <form method="GET" className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              name="q"
              placeholder="Açıklama, kaynak, referans ara..."
              defaultValue={q}
              className="modern-input w-full"
            />
          </div>
          <div className="flex gap-2">
            <select name="category" defaultValue={category} className="modern-input">
              <option value="">Tüm Kategoriler</option>
              <option value="otel">Otel</option>
              <option value="tur">Tur</option>
              <option value="transfer">Transfer</option>
              <option value="ucak">Uçak</option>
              <option value="saglik">Sağlık</option>
              <option value="ofis">Ofis</option>
              <option value="pazarlama">Pazarlama</option>
              <option value="diger">Diğer</option>
            </select>
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              className="modern-input"
              placeholder="Başlangıç"
            />
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo}
              className="modern-input"
              placeholder="Bitiş"
            />
            <select name="sort" defaultValue={sort} className="modern-input">
              <option value="createdAt">Tarih</option>
              <option value="amount">Tutar</option>
              <option value="description">Açıklama</option>
              <option value="source">Kaynak</option>
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

      {/* Transactions List */}
      <div className="modern-card p-6">
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="modern-card-gradient p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {transaction.description}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === "completed" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : transaction.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {transaction.status === "completed" ? "Tamamlandı" :
                         transaction.status === "pending" ? "Beklemede" : "İptal"}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.category === "otel" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" :
                        transaction.category === "tur" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" :
                        transaction.category === "transfer" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" :
                        transaction.category === "ucak" ? "bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400" :
                        transaction.category === "saglik" ? "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400" :
                        transaction.category === "ofis" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" :
                        transaction.category === "pazarlama" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      }`}>
                        {transaction.category === "otel" ? "Otel" :
                         transaction.category === "tur" ? "Tur" :
                         transaction.category === "transfer" ? "Transfer" :
                         transaction.category === "ucak" ? "Uçak" :
                         transaction.category === "saglik" ? "Sağlık" :
                         transaction.category === "ofis" ? "Ofis" :
                         transaction.category === "pazarlama" ? "Pazarlama" : "Diğer"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Kaynak:</span> {transaction.source}
                      </div>
                      <div>
                        <span className="font-medium">Referans:</span> {transaction.reference || "Yok"}
                      </div>
                      <div>
                        <span className="font-medium">Tarih:</span> {transaction.date.toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                    {transaction.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        <span className="font-medium">Notlar:</span> {transaction.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-500">
                      <span>Tutar: ₺{transaction.amount.toLocaleString()}</span>
                      <span>Oluşturulma: {transaction.createdAt.toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link 
                      href={`/muhasebe/giderler/${transaction.id}`}
                      className="modern-button-secondary text-sm"
                    >
                      Düzenle
                    </Link>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">₺{transaction.amount.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">Gider</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Gider Bulunamadı</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {q || category || dateFrom ? "Arama kriterlerinize uygun gider bulunamadı." : "Henüz gider işlemi eklenmemiş."}
            </p>
            {!q && !category && !dateFrom && (
              <Link href="/muhasebe/giderler/yeni" className="modern-button">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                İlk Gideri Ekle
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

