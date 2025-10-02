import KpiCard from "@/components/KpiCard";
import TrendSpark from "@/components/TrendSpark";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { assertModuleEnabled } from "@/lib/moduleGuard";

export default async function DashboardPage() {
  const { allowed } = await assertModuleEnabled("dashboard");
  if (!allowed) {
    return (
      <div className="space-y-3">
        <div className="text-xl font-semibold">Erişim engellendi</div>
        <div className="text-sm text-neutral-500">Bu modül mevcut tenant için kapalı.</div>
      </div>
    );
  }
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || null;

  const whereTenant = tenantId ? { tenantId } : {};

  const [policyCount, pendingOfferCount, collectionSum, vehicleRevenueAgg, transferRevenueAgg, tourRevenueAgg, yachtRevenueAgg, cruiseRevenueAgg, emlakRevenueAgg, hotelRevenueAgg] = await Promise.all([
    prisma.policy.count({ where: whereTenant as any }),
    prisma.offer.count({ where: { ...(whereTenant as any), status: "Beklemede" } }),
    prisma.collection.aggregate({ where: whereTenant as any, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { ...(whereTenant as any), type: "income", status: "completed", category: "arac" }, _sum: { amountTRY: true } }),
    prisma.transaction.aggregate({ where: { ...(whereTenant as any), type: "income", status: "completed", category: "transfer" }, _sum: { amountTRY: true } }),
    prisma.transaction.aggregate({ where: { ...(whereTenant as any), type: "income", status: "completed", category: "tur" }, _sum: { amountTRY: true } }),
    prisma.transaction.aggregate({ where: { ...(whereTenant as any), type: "income", status: "completed", category: "vip_yat" }, _sum: { amountTRY: true } }),
    prisma.transaction.aggregate({ where: { ...(whereTenant as any), type: "income", status: "completed", category: "cruise" }, _sum: { amountTRY: true } }),
    prisma.transaction.aggregate({ where: { ...(whereTenant as any), type: "income", status: "completed", category: "emlak" }, _sum: { amountTRY: true } }),
    prisma.transaction.aggregate({ where: { ...(whereTenant as any), type: "income", status: "completed", category: "otel" }, _sum: { amountTRY: true } }),
  ]);

  const totalCollections = collectionSum._sum.amount || 0;
  const tenantName = tenantId
    ? (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }))?.name || "—"
    : "—";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard title="Toplam Poliçe" value={String(policyCount)} hint="toplam" trend="flat" />
        <KpiCard title="Bekleyen Teklif" value={String(pendingOfferCount)} hint="durum: Beklemede" trend="flat" />
        <KpiCard title="Toplam Tahsilat" value={`₺${totalCollections.toLocaleString("tr-TR")}`} hint="toplam" trend="flat" />
        <KpiCard title="Aktif Tenant" value={tenantName} hint={tenantId ? tenantId.slice(0, 6) + "…" : "—"} trend="flat" />
        <KpiCard title="Araç Geliri" value={`₺${(vehicleRevenueAgg._sum.amountTRY || 0).toLocaleString("tr-TR")}`} hint="voucher gelirleri" trend="up" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard title="Transfer Geliri" value={`₺${(transferRevenueAgg._sum.amountTRY || 0).toLocaleString("tr-TR")}`} hint="transfer gelirleri" trend="up" />
        <KpiCard title="Tur Geliri" value={`₺${(tourRevenueAgg._sum.amountTRY || 0).toLocaleString("tr-TR")}`} hint="tur gelirleri" trend="up" />
        <KpiCard title="Vip Yat Geliri" value={`₺${(yachtRevenueAgg._sum.amountTRY || 0).toLocaleString("tr-TR")}`} hint="yat gelirleri" trend="up" />
        <KpiCard title="Cruise Geliri" value={`₺${(cruiseRevenueAgg._sum.amountTRY || 0).toLocaleString("tr-TR")}`} hint="cruise gelirleri" trend="up" />
        <KpiCard title="Emlak Geliri" value={`₺${(emlakRevenueAgg._sum.amountTRY || 0).toLocaleString("tr-TR")}`} hint="emlak gelirleri" trend="up" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard title="Otel Geliri" value={`₺${(hotelRevenueAgg._sum.amountTRY || 0).toLocaleString("tr-TR")}`} hint="otel gelirleri" trend="up" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded border p-4">
          <div className="font-medium mb-2 flex items-center justify-between">
            <span>Günlük Üretim</span>
            <TrendSpark />
          </div>
          <div className="h-56 grid place-items-center text-neutral-400">Büyük grafik alanı (placeholder)</div>
        </div>
        <div className="rounded border p-4 h-64">
          <div className="font-medium mb-2">Bildirimler</div>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Poliçe sayısı güncel: {policyCount}</li>
            <li>Bekleyen teklif: {pendingOfferCount}</li>
            <li>Tahsilat toplamı: ₺{totalCollections.toLocaleString("tr-TR")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


