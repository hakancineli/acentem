import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";

interface RezervasyonlarPageProps {
  searchParams: {
    page?: string;
    q?: string;
    limit?: string;
    sort?: string;
    dir?: string;
    status?: string;
    hotel?: string;
  };
}

export default async function RezervasyonlarPage({ searchParams }: RezervasyonlarPageProps) {
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
  const status = searchParamsResolved.status || "";
  const hotelId = searchParamsResolved.hotel || "";

  // Build where clause
  const where = {
    tenantId,
    ...(hotelId && { hotelId }),
    ...(status && { status }),
    ...(q && {
      OR: [
        { guestName: { contains: q, mode: "insensitive" as const } },
        { guestEmail: { contains: q, mode: "insensitive" as const } },
        { hotel: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
  };

  // Get reservations with pagination
  const [reservations, totalCount, hotels] = await Promise.all([
    prisma.hotelReservation.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        hotel: true,
      },
    }),
    prisma.hotelReservation.count({ where }),
    prisma.hotel.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Status counts
  const statusCounts = await Promise.all([
    prisma.hotelReservation.count({ where: { tenantId, status: "pending" } }),
    prisma.hotelReservation.count({ where: { tenantId, status: "confirmed" } }),
    prisma.hotelReservation.count({ where: { tenantId, status: "cancelled" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Otel Rezervasyonları</h1>
          <p className="text-slate-600 dark:text-slate-400">Tüm otel rezervasyonlarını yönetin</p>
        </div>
        <Link href="/otel/rezervasyonlar/yeni" className="modern-button">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni Rezervasyon
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-number">{totalCount}</div>
          <div className="stat-label">Toplam Rezervasyon</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statusCounts[0]}</div>
          <div className="stat-label">Bekleyen</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statusCounts[1]}</div>
          <div className="stat-label">Onaylanan</div>
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
              placeholder="Misafir adı, email veya otel adı ara..."
              defaultValue={q}
              className="modern-input w-full"
            />
          </div>
          <div className="flex gap-2">
            <select name="hotel" defaultValue={hotelId} className="modern-input">
              <option value="">Tüm Oteller</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={status} className="modern-input">
              <option value="">Tüm Durumlar</option>
              <option value="pending">Bekleyen</option>
              <option value="confirmed">Onaylanan</option>
              <option value="cancelled">İptal Edilen</option>
            </select>
            <select name="sort" defaultValue={sort} className="modern-input">
              <option value="createdAt">Tarih</option>
              <option value="guestName">Misafir</option>
              <option value="checkIn">Giriş Tarihi</option>
              <option value="totalAmount">Fiyat</option>
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

      {/* Reservations List */}
      <div className="modern-card p-6">
        {reservations.length > 0 ? (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="modern-card-gradient p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {(() => {
                          try {
                            const customers = JSON.parse(reservation.customers as string);
                            if (customers.length > 1) {
                              return `${customers[0].name} +${customers.length - 1} kişi`;
                            }
                            return customers[0]?.name || 'Müşteri bilgisi yok';
                          } catch {
                            return 'Müşteri bilgisi yok';
                          }
                        })()}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        reservation.status === "confirmed" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : reservation.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {reservation.status === "confirmed" ? "Onaylandı" :
                         reservation.status === "pending" ? "Beklemede" : "İptal"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Otel:</span> {reservation.hotel.name}
                      </div>
                      <div>
                        <span className="font-medium">Giriş:</span> {reservation.checkIn.toLocaleDateString("tr-TR")}
                      </div>
                      <div>
                        <span className="font-medium">Çıkış:</span> {reservation.checkOut.toLocaleDateString("tr-TR")}
                      </div>
                      <div>
                        <span className="font-medium">Para Birimi:</span> {reservation.currency}
                      </div>
                    </div>
                    
                    {/* Müşteri Bilgileri */}
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        👥 Müşteri Bilgileri
                      </div>
                      {(() => {
                        try {
                          const customers = JSON.parse(reservation.customers as string);
                          return (
                            <div className="space-y-2">
                              {customers.map((customer: any, index: number) => (
                                <div key={index} className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                  <span className="font-medium">{index + 1}.</span>
                                  <span>{customer.name}</span>
                                  <span>📞 {customer.phone}</span>
                                  {customer.email && <span>✉️ {customer.email}</span>}
                                </div>
                              ))}
                            </div>
                          );
                        } catch {
                          return <div className="text-sm text-slate-500">Müşteri bilgisi yok</div>;
                        }
                      })()}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400 mt-2">
                      <div>
                        <span className="font-medium">Oda:</span> {reservation.rooms} oda
                      </div>
                      <div>
                        <span className="font-medium">Misafir:</span> {reservation.adults} yetişkin, {reservation.children} çocuk
                      </div>
                      <div>
                        <span className="font-medium">Gece:</span> {Math.ceil((reservation.checkOut.getTime() - reservation.checkIn.getTime()) / (1000 * 60 * 60 * 24))} gece
                      </div>
                    </div>
                    {reservation.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        <span className="font-medium">Notlar:</span> {reservation.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-500">
                      <span>
                        Toplam: {(() => {
                          const symbols = { TRY: '₺', USD: '$', EUR: '€' };
                          const symbol = symbols[reservation.currency as keyof typeof symbols] || reservation.currency;
                          return `${symbol}${reservation.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
                        })()}
                        {reservation.currency !== 'TRY' && (
                          <span className="text-xs text-slate-400 ml-1">
                            (≈₺{(reservation.totalAmount * (reservation.exchangeRate || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })})
                          </span>
                        )}
                      </span>
                      <span>Oluşturulma: {reservation.createdAt.toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link 
                      href={`/otel/rezervasyonlar/${reservation.id}`}
                      className="modern-button-secondary text-sm"
                    >
                      Düzenle
                    </Link>
                    <Link 
                      href={`/otel/oteller/${reservation.hotelId}`}
                      className="modern-button text-sm"
                    >
                      Otel Detayı
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Rezervasyon Bulunamadı</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {q || status || hotelId ? "Arama kriterlerinize uygun rezervasyon bulunamadı." : "Henüz rezervasyon eklenmemiş."}
            </p>
            {!q && !status && !hotelId && (
              <Link href="/otel/rezervasyonlar/yeni" className="modern-button">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                İlk Rezervasyonu Ekle
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

