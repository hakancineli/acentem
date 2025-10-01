import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function YeniKiralamaPage() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;

  if (!tenantId) {
    redirect("/login");
  }

  await assertModuleEnabled(tenantId, "arac");

  // Get available vehicles
  const vehicles = await prisma.vehicle.findMany({
    where: {
      tenantId,
      status: "available",
      isActive: true,
    },
    orderBy: { brand: "asc" },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Araç Kiralama</h1>
        <p className="text-gray-600 mt-2">Araç kiralama işlemi oluşturun</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <form action="/api/arac/kiralamalar" method="POST" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Araç Seçimi */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Araç Seçimi *
              </label>
              <select
                name="vehicleId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Araç seçin</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.plate} - {vehicle.dailyRate / 100}₺/gün
                  </option>
                ))}
              </select>
            </div>

            {/* Müşteri Bilgileri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri Adı *
              </label>
              <input
                type="text"
                name="customerName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Müşteri adı soyadı"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon *
              </label>
              <input
                type="tel"
                name="customerPhone"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0555 123 45 67"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="customerEmail"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="musteri@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri ID
              </label>
              <input
                type="text"
                name="customerId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Müşteri ID (varsa)"
              />
            </div>

            {/* Tarih Bilgileri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Tarihi *
              </label>
              <input
                type="date"
                name="startDate"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Tarihi *
              </label>
              <input
                type="date"
                name="endDate"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fiyat Bilgileri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Günlük Ücret (₺) *
              </label>
              <input
                type="number"
                name="dailyRate"
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="500.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Depozito (₺)
              </label>
              <input
                type="number"
                name="deposit"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000.00"
              />
            </div>

            {/* Konum Bilgileri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teslim Yeri
              </label>
              <input
                type="text"
                name="pickupLocation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Teslim yeri"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İade Yeri
              </label>
              <input
                type="text"
                name="returnLocation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="İade yeri"
              />
            </div>

            {/* Durum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <select
                name="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Aktif</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
              </select>
            </div>

            {/* Notlar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlar
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Kiralama ile ilgili notlar..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <a
              href="/arac/kiralamalar"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              İptal
            </a>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Kiralama Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
