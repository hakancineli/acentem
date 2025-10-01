import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export default async function TahsilatlarPage() {
  const { allowed } = await assertModuleEnabled("muhasebe");
  if (!allowed) return <div>Erişim engellendi</div>;
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;
  if (!tenantId) return <div>Tenant bulunamadı</div>;

  // Kiralamalar baz alınır: ödenen (kasada) = transaction var; bekleyen = yok
  const rentals = await prisma.vehicleRental.findMany({
    where: { tenantId },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const transactions = await prisma.transaction.findMany({
    where: { tenantId, type: "income", category: "arac" },
  });
  const paidById = new Set(transactions.map(t => t.reference).filter(Boolean) as string[]);

  const items = rentals.map(r => ({
    id: r.id,
    customerName: r.customerName,
    vehicle: `${r.vehicle.brand} ${r.vehicle.model}`,
    plate: r.vehicle.plate,
    dateRange: `${r.startDate.toLocaleDateString("tr-TR")} - ${r.endDate.toLocaleDateString("tr-TR")}`,
    days: r.days,
    amount: r.totalAmount,
    status: paidById.has(r.id) ? "kasada" : "bekliyor",
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tahsilatlar</h1>
      </div>

      <div className="modern-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Müşteri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Araç</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tarihler</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gün</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tutar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ödeme</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {items.map(it => (
                <tr key={it.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">{it.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{it.vehicle}</div>
                    <div className="text-xs text-slate-500">{it.plate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{it.dateRange}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{it.days} gün</td>
                  <td className="px-6 py-4 whitespace-nowrap">₺{it.amount.toLocaleString("tr-TR")}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${it.status === "kasada" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {it.status === "kasada" ? "Kasada" : "Bekliyor"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {it.status === "bekliyor" ? (
                      <form action="/api/muhasebe/tahsilatlar/pay" method="POST">
                        <input type="hidden" name="rentalId" value={it.id} />
                        <button className="modern-button">Ödeme Al</button>
                      </form>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


