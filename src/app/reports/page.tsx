import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import TrendSpark from "@/components/TrendSpark";
import { assertModuleEnabled } from "@/lib/moduleGuard";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function ReportsPage() {
  const { allowed } = await assertModuleEnabled("reports");
  if (!allowed) {
    return <div className="text-sm text-neutral-500">Bu modül kapalı.</div>;
  }

  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || null;
  const whereTenant = tenantId ? { tenantId } : {};

  const [policyTotal, offerTotal, collectionSum, vehicleRentalTotal, vehicleRentalRevenue, transferBookingTotal, transferRevenue, tourBookingTotal, tourRevenue, yachtRentalTotal, yachtRevenue, cruiseBookingTotal, cruiseRevenue, propertyRentalTotal, propertySaleTotal, emlakRevenue, hotelRevenue] = await Promise.all([
    prisma.policy.count({ where: whereTenant as any }),
    prisma.offer.count({ where: whereTenant as any }),
    prisma.collection.aggregate({ where: whereTenant as any, _sum: { amount: true } }),
    prisma.vehicleRental.count({ where: whereTenant as any }),
    prisma.transaction.aggregate({ 
      where: { 
        ...whereTenant, 
        type: "income",
        status: "completed",
        category: "arac" 
      } as any, 
      _sum: { amountTRY: true } 
    }),
    prisma.transferBooking.count({ where: whereTenant as any }),
    prisma.transaction.aggregate({ 
      where: { 
        ...whereTenant, 
        type: "income",
        status: "completed",
        category: "transfer" 
      } as any, 
      _sum: { amountTRY: true } 
    }),
    prisma.tourBooking.count({ where: whereTenant as any }),
    prisma.transaction.aggregate({ 
      where: { 
        ...whereTenant, 
        type: "income",
        status: "completed",
        category: "tur" 
      } as any, 
      _sum: { amountTRY: true } 
    }),
    prisma.yachtRental.count({ where: whereTenant as any }),
    prisma.transaction.aggregate({ 
      where: { 
        ...whereTenant, 
        type: "income",
        status: "completed",
        category: "vip_yat" 
      } as any, 
      _sum: { amountTRY: true } 
    }),
    prisma.cruiseBooking.count({ where: whereTenant as any }),
    prisma.transaction.aggregate({ 
      where: { 
        ...whereTenant, 
        type: "income",
        status: "completed",
        category: "cruise" 
      } as any, 
      _sum: { amountTRY: true } 
    }),
    prisma.propertyRental.count({ where: whereTenant as any }),
    prisma.propertySale.count({ where: whereTenant as any }),
    prisma.transaction.aggregate({ 
      where: { 
        ...whereTenant, 
        type: "income",
        status: "completed",
        category: "emlak" 
      } as any, 
      _sum: { amountTRY: true } 
    }),
    prisma.transaction.aggregate({ 
      where: { 
        ...whereTenant, 
        type: "income",
        status: "completed",
        category: "otel" 
      } as any, 
      _sum: { amountTRY: true } 
    }),
  ]);

  const series = await Promise.all(
    Array.from({ length: 7 }).map(async (_, idx) => {
      const dayStart = daysAgo(6 - idx);
      const next = new Date(dayStart);
      next.setDate(next.getDate() + 1);
      const whereDay = { ...whereTenant, createdAt: { gte: dayStart, lt: next } } as any;
      const [p, o, c, vr, vrRev, tb, tr, tbr, trr, yr, yrRev, cb, cr, pr, ps, er] = await Promise.all([
        prisma.policy.count({ where: whereDay }),
        prisma.offer.count({ where: whereDay }),
        prisma.collection.aggregate({ where: whereDay, _sum: { amount: true } }),
        prisma.vehicleRental.count({ where: whereDay }),
        prisma.transaction.aggregate({ 
          where: { 
            ...whereDay, 
            type: "income",
            status: "completed",
            category: "arac" 
          } as any, 
          _sum: { amountTRY: true } 
        }),
        prisma.transferBooking.count({ where: whereDay }),
        prisma.transaction.aggregate({ 
          where: { 
            ...whereDay, 
            type: "income",
            status: "completed",
            category: "transfer" 
          } as any, 
          _sum: { amountTRY: true } 
        }),
        prisma.tourBooking.count({ where: whereDay }),
        prisma.transaction.aggregate({ 
          where: { 
            ...whereDay, 
            type: "income",
            status: "completed",
            category: "tur" 
          } as any, 
          _sum: { amountTRY: true } 
        }),
        prisma.yachtRental.count({ where: whereDay }),
        prisma.transaction.aggregate({ 
          where: { 
            ...whereDay, 
            type: "income",
            status: "completed",
            category: "vip_yat" 
          } as any, 
          _sum: { amountTRY: true } 
        }),
        prisma.cruiseBooking.count({ where: whereDay }),
        prisma.transaction.aggregate({ 
          where: { 
            ...whereDay, 
            type: "income",
            status: "completed",
            category: "cruise" 
          } as any, 
          _sum: { amountTRY: true } 
        }),
        prisma.propertyRental.count({ where: whereDay }),
        prisma.propertySale.count({ where: whereDay }),
        prisma.transaction.aggregate({ 
          where: { 
            ...whereDay, 
            type: "income",
            status: "completed",
            category: "emlak" 
          } as any, 
          _sum: { amountTRY: true } 
        }),
      ]);
      return { p, o, c: c._sum.amount || 0, vr, vrRev: vrRev._sum.amountTRY || 0, tb, tr: tr._sum.amountTRY || 0, tbr, trr: trr._sum.amountTRY || 0, yr, yrRev: yrRev._sum.amountTRY || 0, cb, cr: cr._sum.amountTRY || 0, pr, ps, er: er._sum.amountTRY || 0 };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Raporlar</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <div className="font-medium mb-1">Toplam Poliçe: {policyTotal}</div>
          <TrendSpark points={series.map((s) => s.p)} />
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">Toplam Teklif: {offerTotal}</div>
          <TrendSpark points={series.map((s) => s.o)} />
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">Toplam Tahsilat: ₺{(collectionSum._sum.amount || 0).toLocaleString("tr-TR")}</div>
          <TrendSpark points={series.map((s) => Math.max(1, Math.round(s.c / 1000)))} />
          <div className="text-xs text-neutral-500 mt-1">(binlik ölçek)</div>
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🚗 Toplam Kiralama: {vehicleRentalTotal}</div>
          <TrendSpark points={series.map((s) => s.vr)} />
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🚗 Araç Geliri: ₺{(vehicleRentalRevenue._sum.amountTRY || 0).toLocaleString("tr-TR")}</div>
          <TrendSpark points={series.map((s) => Math.max(1, Math.round(s.vrRev / 1000)))} />
          <div className="text-xs text-neutral-500 mt-1">(binlik ölçek)</div>
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🚐 Toplam Transfer: {transferBookingTotal}</div>
          <TrendSpark points={series.map((s) => s.tb)} />
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🚐 Transfer Geliri: ₺{(transferRevenue._sum.amountTRY || 0).toLocaleString("tr-TR")}</div>
          <TrendSpark points={series.map((s) => Math.max(1, Math.round(s.tr / 1000)))} />
          <div className="text-xs text-neutral-500 mt-1">(binlik ölçek)</div>
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🏛️ Toplam Tur: {tourBookingTotal}</div>
          <TrendSpark points={series.map((s) => s.tbr)} />
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🏛️ Tur Geliri: ₺{(tourRevenue._sum.amountTRY || 0).toLocaleString("tr-TR")}</div>
          <TrendSpark points={series.map((s) => Math.max(1, Math.round(s.trr / 1000)))} />
          <div className="text-xs text-neutral-500 mt-1">(binlik ölçek)</div>
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🛥️ Toplam Yat Kiralama: {yachtRentalTotal}</div>
          <TrendSpark points={series.map((s) => s.yr)} />
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🛥️ Yat Geliri: ₺{(yachtRevenue._sum.amountTRY || 0).toLocaleString("tr-TR")}</div>
          <TrendSpark points={series.map((s) => Math.max(1, Math.round(s.yrRev / 1000)))} />
          <div className="text-xs text-neutral-500 mt-1">(binlik ölçek)</div>
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🚢 Toplam Cruise: {cruiseBookingTotal}</div>
          <TrendSpark points={series.map((s) => s.cb)} />
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🚢 Cruise Geliri: ₺{(cruiseRevenue._sum.amountTRY || 0).toLocaleString("tr-TR")}</div>
          <TrendSpark points={series.map((s) => Math.max(1, Math.round(s.cr / 1000)))} />
          <div className="text-xs text-neutral-500 mt-1">(binlik ölçek)</div>
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🏠 Toplam Emlak Kiralama: {propertyRentalTotal}</div>
          <TrendSpark points={series.map((s) => s.pr)} />
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🏠 Toplam Emlak Satışı: {propertySaleTotal}</div>
          <TrendSpark points={series.map((s) => s.ps)} />
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-1">🏠 Emlak Geliri: ₺{(emlakRevenue._sum.amountTRY || 0).toLocaleString("tr-TR")}</div>
          <TrendSpark points={series.map((s) => Math.max(1, Math.round(s.er / 1000)))} />
          <div className="text-xs text-neutral-500 mt-1">(binlik ölçek)</div>
        </div>

        <div className="rounded border p-4">
          <div className="font-medium mb-1">🏨 Otel Geliri: ₺{(hotelRevenue._sum.amountTRY || 0).toLocaleString("tr-TR")}</div>
          <div className="text-xs text-neutral-500 mt-1">(amountTRY)</div>
        </div>
      </div>
    </div>
  );
}

