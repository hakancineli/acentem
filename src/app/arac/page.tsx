import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AracPage() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;

  if (!tenantId) {
    redirect("/login");
  }

  await assertModuleEnabled(tenantId, "arac");

  // Araç kiralama istatistikleri
  const [
    totalVehicles,
    totalRentals,
    totalRevenue
  ] = await Promise.all([
    prisma.vehicle.count({ where: { tenantId } }),
    prisma.vehicleRental.count({ where: { tenantId } }),
    prisma.transaction.aggregate({
      where: { tenantId, type: "income", category: "arac" },
      _sum: { amount: true }
    })
  ]);

  // Son kiralamalar (liste tabloda kullanılacak)
  const recentRentals = await prisma.vehicleRental.findMany({
    where: { tenantId },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
    
    const statusText = {
      active: "Aktif",
      completed: "Tamamlandı",
      pending: "Beklemede",
      confirmed: "Onaylandı",
      cancelled: "İptal",
      overdue: "Gecikmiş"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[status as keyof typeof statusMap]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            🚗 Araç Kiralama
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Araç kiralama işlemlerini yönetin
          </p>
        </div>
        <div />
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="modern-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Toplam Araç
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {totalVehicles}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="modern-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Aktif Kiralama
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {totalRentals}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        

        <div className="modern-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Toplam Gelir
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalRevenue._sum.amount || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı İşlemler (üstte) */}
      <div className="modern-card p-6">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/arac/araclar/yeni" className="modern-button block text-center">Yeni Araç Ekle</Link>
          <Link href="/arac/araclar" className="modern-button-secondary block text-center">Araç Listesi</Link>
          <Link href="/arac/kiralamalar/yeni" className="modern-button-secondary block text-center">Yeni Kiralama</Link>
          
        </div>
      </div>

      {/* Araç Kiralamaları (tam liste) */}
      <div className="modern-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Araç Kiralamaları</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Müşteri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Araç</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tarihler</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gün</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tutar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {(() => {
                // Tek kiralama mantığına geçiş: sadece rentals göster
                return recentRentals.length > 0 ? recentRentals.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-slate-100">{row.vehicle.brand} {row.vehicle.model}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{row.vehicle.plate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{formatDate(row.startDate)} - {formatDate(row.endDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{row.days} gün</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{formatCurrency(row.totalAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(row.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a href={`/api/arac/kiralamalar/${row.id}/voucher`} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3" download>
                        Voucher (PDF)
                      </a>
                      <Link href={`/arac/kiralamalar/${row.id}/duzenle`} className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300">Düzenle</Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Henüz işlem bulunmuyor</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

