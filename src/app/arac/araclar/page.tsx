import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

interface SearchParams {
  page?: string;
  q?: string;
  status?: string;
  type?: string;
  sort?: string;
  dir?: string;
}

export default async function AraclarPage({
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
  const offset = (page - 1) * limit;
  const search = params.q || "";
  const status = params.status || "";
  const type = params.type || "";
  const sort = params.sort || "createdAt";
  const dir = params.dir || "desc";

  // Araç listesi
  const where = {
    tenantId,
    ...(search && {
      OR: [
        { brand: { contains: search } },
        { model: { contains: search } },
        { plate: { contains: search } },
        { color: { contains: search } },
      ],
    }),
    ...(status && { status }),
    ...(type && { type }),
  };

  const [vehicles, totalCount] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: offset,
      take: limit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      rented: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      out_of_service: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
    
    const statusText = {
      available: "Müsait",
      rented: "Kiralık",
      maintenance: "Bakımda",
      out_of_service: "Servis Dışı"
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
            🚗 Araç Listesi
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Araçlarınızı yönetin ve takip edin
          </p>
        </div>
        <Link href="/arac/araclar/yeni" className="modern-button">
          Yeni Araç Ekle
        </Link>
      </div>

      {/* Filtreler */}
      <div className="modern-card p-6">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Arama
            </label>
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Marka, model, plaka ara..."
              className="modern-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Durum
            </label>
            <select name="status" defaultValue={status} className="modern-input">
              <option value="">Tümü</option>
              <option value="available">Müsait</option>
              <option value="rented">Kiralık</option>
              <option value="maintenance">Bakımda</option>
              <option value="out_of_service">Servis Dışı</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tip
            </label>
            <select name="type" defaultValue={type} className="modern-input">
              <option value="">Tümü</option>
              <option value="sedan">Sedan</option>
              <option value="hatchback">Hatchback</option>
              <option value="SUV">SUV</option>
              <option value="van">Van</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="modern-button w-full">
              Filtrele
            </button>
          </div>
        </form>
      </div>

      {/* Araç Listesi */}
      <div className="modern-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Araç
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Özellikler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Konum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {vehicle.year} • {vehicle.plate}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 dark:text-slate-100">
                      {vehicle.seats} kişi • {vehicle.doors} kapı
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {vehicle.fuel} • {vehicle.transmission}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 dark:text-slate-100">
                      {formatCurrency(vehicle.dailyRate)}/gün
                    </div>
                    {vehicle.weeklyRate && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {formatCurrency(vehicle.weeklyRate)}/hafta
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(vehicle.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {vehicle.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/arac/araclar/${vehicle.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        Görüntüle
                      </Link>
                      <Link
                        href={`/arac/araclar/${vehicle.id}/duzenle`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                      >
                        Düzenle
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}&q=${search}&status=${status}&type=${type}&sort=${sort}&dir=${dir}`}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Önceki
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}&q=${search}&status=${status}&type=${type}&sort=${sort}&dir=${dir}`}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Sonraki
                </Link>
              )}
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium">{offset + 1}</span> -{" "}
                  <span className="font-medium">{Math.min(offset + limit, totalCount)}</span> arası, toplam{" "}
                  <span className="font-medium">{totalCount}</span> sonuç
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {page > 1 && (
                    <Link
                      href={`?page=${page - 1}&q=${search}&status=${status}&type=${type}&sort=${sort}&dir=${dir}`}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Önceki
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`?page=${pageNum}&q=${search}&status=${status}&type=${type}&sort=${sort}&dir=${dir}`}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === page
                          ? "z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))}
                  {page < totalPages && (
                    <Link
                      href={`?page=${page + 1}&q=${search}&status=${status}&type=${type}&sort=${sort}&dir=${dir}`}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Sonraki
                    </Link>
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

