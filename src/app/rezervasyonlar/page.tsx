import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { assertModuleEnabled } from "@/lib/moduleGuard";
import Link from "next/link";

type Row = {
  id: string;
  module: string;
  title: string;
  subtitle?: string;
  dateFrom: Date | string;
  dateTo?: Date | string | null;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  href: string;
};

export default async function AllReservationsPage() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || null;
  if (!tenantId) {
    return <div className="text-sm text-neutral-500">Tenant seçilmedi.</div>;
  }

  const modules = [
    { key: "otel", allowed: (await assertModuleEnabled("otel")).allowed },
    { key: "tur", allowed: (await assertModuleEnabled("tur")).allowed },
    { key: "transfer", allowed: (await assertModuleEnabled("transfer")).allowed },
    { key: "ucak", allowed: (await assertModuleEnabled("ucak")).allowed },
    { key: "saglik", allowed: (await assertModuleEnabled("saglik")).allowed },
    { key: "arac", allowed: (await assertModuleEnabled("arac")).allowed },
    { key: "vip_yat", allowed: (await assertModuleEnabled("vip_yat")).allowed },
    { key: "cruise", allowed: (await assertModuleEnabled("cruise")).allowed },
    { key: "emlak", allowed: (await assertModuleEnabled("emlak")).allowed },
  ].filter((m) => m.allowed);

  const rows: Row[] = [];

  // Otel
  if (modules.find((m) => m.key === "otel")) {
    const list = await prisma.hotelReservation.findMany({
      where: { tenantId },
      include: { hotel: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const r of list) {
      rows.push({
        id: r.id,
        module: "Otel",
        title: r.hotel?.name || "Otel",
        subtitle: `${r.rooms} oda, ${r.adults} yetişkin${r.children ? ", " + r.children + " çocuk" : ""}`,
        dateFrom: r.checkIn,
        dateTo: r.checkOut,
        amount: r.totalAmount,
        currency: r.currency,
        status: r.status,
        href: `/otel/rezervasyonlar/${r.id}`,
      });
    }
  }

  // Transfer
  if (modules.find((m) => m.key === "transfer")) {
    const list = await prisma.transferBooking.findMany({
      where: { tenantId },
      include: { transfer: true, driver: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const r of list) {
      rows.push({
        id: r.id,
        module: "Transfer",
        title: r.transfer?.name || "Transfer",
        subtitle: r.driver ? `Şoför: ${r.driver.name}` : undefined,
        dateFrom: r.pickupTime,
        amount: r.totalPrice as any,
        currency: "TRY",
        status: r.status,
        href: `/transfer/rezervasyonlar/${r.id}/duzenle`,
      });
    }
  }

  // Tur
  if (modules.find((m) => m.key === "tur")) {
    const list = await prisma.tourBooking.findMany({
      where: { tenantId },
      include: { tour: true, driver: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const r of list) {
      rows.push({
        id: r.id,
        module: "Tur",
        title: r.tour?.name || "Tur",
        subtitle: r.driver ? `Şoför/Rehber: ${r.driver.name}` : undefined,
        dateFrom: r.date,
        amount: r.totalPrice as any,
        currency: "TRY",
        status: r.status,
        href: `/tur/rezervasyonlar/${r.id}/duzenle`,
      });
    }
  }

  // Uçak
  if (modules.find((m) => m.key === "ucak")) {
    const list = await prisma.flightBooking.findMany({
      where: { tenantId },
      include: { flight: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const r of list) {
      rows.push({
        id: r.id,
        module: "Uçak",
        title: r.flight?.code || "Uçuş",
        subtitle: `${r.flight?.from || ""} → ${r.flight?.to || ""}`,
        dateFrom: r.flightDate,
        amount: r.totalAmount as any,
        currency: "TRY",
        status: r.status,
        href: `/ucak/rezervasyonlar/${r.id}`,
      });
    }
  }

  // Sağlık
  if (modules.find((m) => m.key === "saglik")) {
    const list = await prisma.healthPolicy.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const r of list) {
      rows.push({
        id: r.id,
        module: "Sağlık",
        title: r.customerName,
        subtitle: `Poliçe #${r.id.slice(-6)}`,
        dateFrom: r.createdAt,
        amount: r.totalAmount as any,
        currency: "TRY",
        status: r.status,
        href: `/saglik/policeler/${r.id}`,
      });
    }
  }

  // Araç
  if (modules.find((m) => m.key === "arac")) {
    const list = await prisma.vehicleRental.findMany({
      where: { tenantId },
      include: { vehicle: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const r of list) {
      rows.push({
        id: r.id,
        module: "Araç",
        title: r.vehicle?.name || "Araç Kiralama",
        subtitle: r.customerName,
        dateFrom: r.startDate,
        dateTo: r.endDate,
        amount: r.price as any,
        currency: "TRY",
        status: r.status,
        href: `/arac/kiralamalar/${r.id}/duzenle`,
      });
    }
  }

  // Vip Yat
  if (modules.find((m) => m.key === "vip_yat")) {
    const list = await prisma.yachtBooking.findMany({
      where: { tenantId },
      include: { yacht: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const r of list) {
      rows.push({
        id: r.id,
        module: "Vip Yat",
        title: r.yacht?.name || "Yat Rezervasyonu",
        dateFrom: r.startDate,
        dateTo: r.endDate,
        amount: r.totalAmount as any,
        currency: "TRY",
        status: r.status,
        href: `/vip-yat/rezervasyonlar/${r.id}`,
      });
    }
  }

  // Cruise
  if (modules.find((m) => m.key === "cruise")) {
    const list = await prisma.cruiseBooking.findMany({
      where: { tenantId },
      include: { cruise: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const r of list) {
      rows.push({
        id: r.id,
        module: "Cruise",
        title: r.cruise?.name || "Cruise",
        dateFrom: r.startDate,
        dateTo: r.endDate,
        amount: r.totalAmount as any,
        currency: "TRY",
        status: r.status,
        href: `/cruise/rezervasyonlar/${r.id}`,
      });
    }
  }

  // Emlak (kiralama ve satış)
  if (modules.find((m) => m.key === "emlak")) {
    const [rentals, sales] = await Promise.all([
      prisma.propertyRental.findMany({ where: { tenantId }, include: { property: true }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.propertySale.findMany({ where: { tenantId }, include: { property: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    for (const r of rentals) {
      rows.push({
        id: r.id,
        module: "Emlak",
        title: r.property?.title || "Emlak Kiralama",
        dateFrom: r.startDate,
        dateTo: r.endDate,
        amount: r.totalAmount as any,
        currency: "TRY",
        status: r.status,
        href: `/emlak/kiralamalar/${r.id}`,
      });
    }
    for (const s of sales) {
      rows.push({
        id: s.id,
        module: "Emlak",
        title: s.property?.title || "Emlak Satış",
        dateFrom: s.createdAt,
        amount: s.totalAmount as any,
        currency: "TRY",
        status: s.status,
        href: `/emlak/satislar/${s.id}`,
      });
    }
  }

  rows.sort((a, b) => new Date(b.dateFrom as any).getTime() - new Date(a.dateFrom as any).getTime());

  const symbol = (c?: string | null) => (c === "USD" ? "$" : c === "EUR" ? "€" : "₺");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tüm Rezervasyonlar</h1>
          <p className="text-sm text-slate-500">Aktif tenant ve açık modüller</p>
        </div>
      </div>

      <div className="modern-card p-6">
        {rows.length === 0 ? (
          <div className="text-sm text-slate-500">Kayıt bulunamadı.</div>
        ) : (
          <div className="divide-y">
            {rows.map((r) => (
              <Link key={r.id} href={r.href} className="block py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.module} • {r.title}</div>
                    <div className="text-xs text-slate-500">
                      {r.subtitle ? r.subtitle + " • " : ""}
                      {new Date(r.dateFrom as any).toLocaleDateString("tr-TR")}
                      {r.dateTo ? ` → ${new Date(r.dateTo as any).toLocaleDateString("tr-TR")}` : ""}
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-600 dark:text-slate-300">
                    {r.amount != null && (
                      <div>
                        {symbol(r.currency)}{Number(r.amount).toLocaleString("tr-TR")}
                      </div>
                    )}
                    {r.status && <div className="text-xs text-slate-500">{r.status}</div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


