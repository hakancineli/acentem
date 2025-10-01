import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AracDetayPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;
  if (!tenantId) return <div>Tenant bulunamadı</div>;

  const vehicle = await prisma.vehicle.findFirst({ where: { id: params.id, tenantId } });
  if (!vehicle) return <div>Araç bulunamadı</div>;

  const formatCurrency = (amount: number | null) => amount == null ? "-" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      available: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      rented: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
      out_of_service: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
    };
    const text: Record<string, string> = {
      available: "Müsait",
      rented: "Kiralık",
      maintenance: "Bakımda",
      out_of_service: "Servis Dışı",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[vehicle.status]}`}>{text[vehicle.status] || vehicle.status}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Araç Detayı</h1>
          <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400">
            <span className="font-medium">{vehicle.brand} {vehicle.model}</span>
            <span>• {vehicle.year}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{vehicle.plate}</span>
            {statusBadge(vehicle.status)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/arac/araclar/${vehicle.id}/duzenle`} className="modern-button">Düzenle</Link>
          <Link href="/arac/araclar" className="modern-button-secondary">Listeye Dön</Link>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teknik */}
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-slate-900 dark:text-slate-100">Teknik</div>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Koltuk</dt>
              <dd className="text-slate-800 dark:text-slate-200">{vehicle.seats} kişi</dd>
            </div>
            <div>
              <dt className="text-slate-500">Kapı</dt>
              <dd className="text-slate-800 dark:text-slate-200">{vehicle.doors} kapı</dd>
            </div>
            <div>
              <dt className="text-slate-500">Yakıt • Vites</dt>
              <dd className="text-slate-800 dark:text-slate-200">{vehicle.fuel} • {vehicle.transmission}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Renk • Motor</dt>
              <dd className="text-slate-800 dark:text-slate-200">{vehicle.color} • {vehicle.engine || "-"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-slate-500">Konum</dt>
              <dd className="text-slate-800 dark:text-slate-200">{vehicle.location}</dd>
            </div>
          </dl>
        </div>

        {/* Fiyatlandırma */}
        <div className="modern-card p-6">
          <div className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Fiyatlandırma</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-slate-500">Günlük</div>
            <div className="text-slate-800 dark:text-slate-200">{formatCurrency(vehicle.dailyRate)}</div>
            <div className="text-slate-500">Haftalık</div>
            <div className="text-slate-800 dark:text-slate-200">{formatCurrency(vehicle.weeklyRate)}</div>
            <div className="text-slate-500">Aylık</div>
            <div className="text-slate-800 dark:text-slate-200">{formatCurrency(vehicle.monthlyRate)}</div>
            <div className="text-slate-500">Depozito</div>
            <div className="text-slate-800 dark:text-slate-200">{formatCurrency(vehicle.deposit)}</div>
          </div>
        </div>

        {/* Açıklama */}
        {vehicle.description && (
          <div className="modern-card p-6 lg:col-span-2">
            <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Açıklama</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{vehicle.description}</div>
          </div>
        )}
      </div>
    </div>
  );
}


