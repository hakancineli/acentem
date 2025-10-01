import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

interface SearchParams {
  page?: string;
  q?: string;
  sort?: string;
  dir?: string;
  status?: string;
  vehicle?: string;
}

export default async function KiralamalarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;

  if (!tenantId) {
    redirect("/login");
  }

  await assertModuleEnabled(tenantId, "arac");

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 10;
  const q = params.q || "";
  const sort = params.sort || "createdAt";
  const dir = params.dir || "desc";
  const status = params.status || "";
  const vehicleId = params.vehicle || "";

  // Common filters for both
  const commonWhere = {
    tenantId,
    ...(vehicleId && { vehicleId }),
    ...(status && { status }),
    ...(q && {
      OR: [
        { customerName: { contains: q, mode: "insensitive" as const } },
        { customerPhone: { contains: q, mode: "insensitive" as const } },
        { customerEmail: { contains: q, mode: "insensitive" as const } },
        { vehicle: { brand: { contains: q, mode: "insensitive" as const } } },
        { vehicle: { model: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
  } as const;

  const [rentalsRaw, bookingsRaw] = await Promise.all([
    prisma.vehicleRental.findMany({ where: commonWhere, orderBy: { [sort]: dir }, take: limit * 5, include: { vehicle: true } }),
    prisma.vehicleBooking.findMany({ where: commonWhere, orderBy: { [sort]: dir }, take: limit * 5, include: { vehicle: true } }),
  ]);

  type RowItem = {
    id: string;
    kind: "rental" | "booking";
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    vehicle: { brand: string; model: string; plate: string };
    startDate: Date;
    endDate: Date;
    days: number;
    totalAmount: number;
    status: string;
    createdAt: Date;
  };

  const rentals: RowItem[] = rentalsRaw.map((r) => ({
    id: r.id,
    kind: "rental",
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    customerEmail: r.customerEmail,
    vehicle: { brand: r.vehicle.brand, model: r.vehicle.model, plate: r.vehicle.plate },
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days,
    totalAmount: r.totalAmount,
    status: r.status,
    createdAt: r.createdAt,
  }));

  const bookings: RowItem[] = bookingsRaw.map((b) => ({
    id: b.id,
    kind: "booking",
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    customerEmail: b.customerEmail,
    vehicle: { brand: b.vehicle.brand, model: b.vehicle.model, plate: b.vehicle.plate },
    startDate: b.startDate,
    endDate: b.endDate,
    days: b.days,
    totalAmount: b.totalAmount,
    status: b.status,
    createdAt: b.createdAt,
  }));

  const merged = [...rentals, ...bookings].sort((a, b) => (dir === "asc" ? 1 : -1) * (a.createdAt.getTime() - b.createdAt.getTime()));
  const totalCount = merged.length;
  const rows = merged.slice((page - 1) * limit, page * limit);

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
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      overdue: "bg-orange-100 text-orange-800",
    };
    return statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      active: "Aktif",
      completed: "Tamamlandı",
      cancelled: "İptal",
      overdue: "Gecikmiş",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Araç Kiralamaları</h1>
          <Link
            href="/arac/kiralamalar/yeni"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Yeni Kiralama
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
          <form method="GET" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arama
              </label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Müşteri adı, telefon, email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durum
              </label>
              <select
                name="status"
                defaultValue={status}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tümü</option>
                <option value="active">Aktif</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
                <option value="overdue">Gecikmiş</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sıralama
              </label>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Tarih</option>
                <option value="customerName">Müşteri</option>
                <option value="totalAmount">Tutar</option>
                <option value="startDate">Başlangıç</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Filtrele
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Rentals List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Araç
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarihler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gün
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((rental) => (
                <tr key={rental.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {rental.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {rental.customerPhone}
                      </div>
                      {rental.customerEmail && (
                        <div className="text-sm text-gray-500">
                          {rental.customerEmail}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rental.vehicle.brand} {rental.vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">
                      {rental.vehicle.plate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rental.days} gün
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(rental.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(rental.status)}`}>
                      {getStatusText(rental.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {rental.kind === "rental" ? (
                      <>
                        <a href={`/api/arac/kiralamalar/${rental.id}/voucher`} className="text-blue-600 hover:text-blue-900 mr-3" download>
                          Voucher (PDF)
                        </a>
                        <Link href={`/arac/kiralamalar/${rental.id}/duzenle`} className="text-green-600 hover:text-green-900">Düzenle</Link>
                      </>
                    ) : (
                      <Link href={`/arac/rezervasyonlar/${rental.id}/duzenle`} className="text-green-600 hover:text-green-900">Düzenle</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > limit && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Toplam {totalCount} kiralama, sayfa {page} / {Math.ceil(totalCount / limit)}
              </div>
              <div className="flex space-x-2">
                {page > 1 && (
                  <Link
                    href={`?page=${page - 1}&q=${q}&sort=${sort}&dir=${dir}&status=${status}&vehicle=${vehicleId}`}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Önceki
                  </Link>
                )}
                {page < Math.ceil(totalCount / limit) && (
                  <Link
                    href={`?page=${page + 1}&q=${q}&sort=${sort}&dir=${dir}&status=${status}&vehicle=${vehicleId}`}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Sonraki
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
