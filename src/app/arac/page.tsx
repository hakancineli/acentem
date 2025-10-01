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
    pendingBookings,
    totalRevenue
  ] = await Promise.all([
    prisma.vehicle.count({ where: { tenantId } }),
    prisma.vehicleRental.count({ where: { tenantId } }),
    prisma.vehicleBooking.count({ where: { tenantId, status: "pending" } }),
    prisma.transaction.aggregate({
      where: { tenantId, type: "income", category: "arac" },
      _sum: { amount: true }
    })
  ]);

  // Son kiralama işlemleri
  const recentRentals = await prisma.vehicleRental.findMany({
    where: { tenantId },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // Son rezervasyonlar
  const recentBookings = await prisma.vehicleBooking.findMany({
    where: { tenantId },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(amount / 100);
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
        <div className="flex gap-3">
          <Link href="/arac/araclar/yeni" className="modern-button">
            Yeni Araç
          </Link>
          <Link href="/arac/kiralamalar/yeni" className="modern-button-secondary">
            Yeni Kiralama
          </Link>
        </div>
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
                Bekleyen Rezervasyon
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {pendingBookings}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

      {/* İçerik Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Kiralama İşlemleri */}
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Son Kiralama İşlemleri
            </h3>
            <Link href="/arac/kiralama" className="text-blue-600 dark:text-blue-400 hover:underline">
              Tümünü Gör
            </Link>
          </div>
          <div className="space-y-4">
            {recentRentals.map((rental) => (
              <div key={rental.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {rental.customerName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {rental.vehicle.brand} {rental.vehicle.model}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</span>
                    <span>{rental.days} gün</span>
                    <span>{formatCurrency(rental.totalAmount)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(rental.status)}
                </div>
              </div>
            ))}
            {recentRentals.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                Henüz kiralama işlemi bulunmuyor
              </p>
            )}
          </div>
        </div>

        {/* Son Rezervasyonlar */}
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Son Rezervasyonlar
            </h3>
            <Link href="/arac/rezervasyonlar" className="text-blue-600 dark:text-blue-400 hover:underline">
              Tümünü Gör
            </Link>
          </div>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {booking.customerName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {booking.vehicle.brand} {booking.vehicle.model}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                    <span>{booking.days} gün</span>
                    <span>{formatCurrency(booking.totalAmount)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(booking.status)}
                </div>
              </div>
            ))}
            {recentBookings.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                Henüz rezervasyon bulunmuyor
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hızlı İşlemler */}
      <div className="modern-card p-6">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/arac/araclar/yeni" className="modern-button block text-center">
            Yeni Araç Ekle
          </Link>
          <Link href="/arac/araclar" className="modern-button-secondary block text-center">
            Araç Listesi
          </Link>
          <Link href="/arac/kiralamalar/yeni" className="modern-button-secondary block text-center">
            Yeni Kiralama
          </Link>
          <Link href="/arac/rezervasyonlar" className="modern-button-secondary block text-center">
            Rezervasyonlar
          </Link>
        </div>
      </div>
    </div>
  );
}

