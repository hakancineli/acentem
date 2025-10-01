import Link from "next/link";
import { assertModuleEnabled } from "@/lib/moduleGuard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export default async function OffersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { allowed } = await assertModuleEnabled("offers");
  if (!allowed) {
    return (
      <div className="space-y-3">
        <div className="text-xl font-semibold">Erişim engellendi</div>
        <div className="text-sm text-neutral-500">Bu modül mevcut tenant için kapalı.</div>
        <Link href="/admin" className="underline">Admin ekranına gidin</Link>
      </div>
    );
  }
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || null;

  const sp = (await searchParams) || {};
  const q = (sp.q as string) || "";
  const page = Math.max(1, parseInt((sp.page as string) || "1", 10));
  const limit = Math.min(50, Math.max(5, parseInt((sp.limit as string) || "20", 10)));
  const sort = (sp.sort as string) || "createdAt";
  const dir = ((sp.dir as string) || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const start = sp.start ? new Date(sp.start as string) : null;
  const end = sp.end ? new Date(sp.end as string) : null;

  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { status: { contains: q, mode: "insensitive" } },
    ];
  }
  if (start || end) {
    where.createdAt = {};
    if (start) (where.createdAt as any).gte = start;
    if (end) {
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      (where.createdAt as any).lte = e;
    }
  }

  const [total, rows] = await Promise.all([
    prisma.offer.count({ where }),
    prisma.offer.findMany({
      where,
      orderBy: { [sort]: dir as any },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Teklifler</h1>
      <div className="rounded border p-4 space-y-3">
        <form className="flex items-center gap-2">
          <input
            name="q"
            placeholder="Ara (başlık, durum)"
            defaultValue={q}
            className="w-64 rounded border bg-transparent px-3 py-2 text-sm"
          />
          <input type="date" name="start" defaultValue={sp.start as string | undefined} className="rounded border bg-transparent px-2 py-1 text-sm" />
          <input type="date" name="end" defaultValue={sp.end as string | undefined} className="rounded border bg-transparent px-2 py-1 text-sm" />
          <button className="px-3 py-2 rounded border text-sm">Ara</button>
          <a
            className="px-3 py-2 rounded border text-sm"
            href={`/api/export/offers?limit=${limit}&page=${page}&sort=${sort}&dir=${dir}${q ? `&q=${encodeURIComponent(q)}` : ""}${sp.start ? `&start=${encodeURIComponent(sp.start as string)}` : ""}${sp.end ? `&end=${encodeURIComponent(sp.end as string)}` : ""}`}
            target="_blank"
          >
            CSV Dışa Aktar
          </a>
        </form>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="py-2">
                <Link href={`?sort=title&dir=${sort === "title" && dir === "asc" ? "desc" : "asc"}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Başlık</Link>
              </th>
              <th>
                <Link href={`?sort=amount&dir=${sort === "amount" && dir === "asc" ? "desc" : "asc"}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Tutar</Link>
              </th>
              <th>
                <Link href={`?sort=status&dir=${sort === "status" && dir === "asc" ? "desc" : "asc"}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Durum</Link>
              </th>
              <th>
                <Link href={`?sort=createdAt&dir=${sort === "createdAt" && dir === "asc" ? "desc" : "asc"}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Tarih</Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.title}</td>
                <td>₺{r.amount}</td>
                <td>{r.status}</td>
                <td>{new Date(r.createdAt).toLocaleDateString("tr-TR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <div>Toplam {total} kayıt</div>
          <div className="flex items-center gap-2">
            <Link className="underline disabled:opacity-50" href={`?page=${Math.max(1, page - 1)}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}&sort=${sort}&dir=${dir}`} aria-disabled={page <= 1}>Önceki</Link>
            <span>Sayfa {page}/{totalPages}</span>
            <Link className="underline disabled:opacity-50" href={`?page=${Math.min(totalPages, page + 1)}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}&sort=${sort}&dir=${dir}`} aria-disabled={page >= totalPages}>Sonraki</Link>
          </div>
        </div>
      </div>
    </div>
  );
}


