import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

function csvEscape(value: unknown) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || null;
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const sort = url.searchParams.get("sort") || "createdAt";
  const dir = (url.searchParams.get("dir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { holder: { contains: q, mode: "insensitive" } },
    ];
  }
  if (start || end) {
    where.createdAt = {};
    if (start) (where.createdAt as any).gte = new Date(start);
    if (end) {
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      (where.createdAt as any).lte = e;
    }
  }

  const rows = await prisma.policy.findMany({ where, orderBy: { [sort]: dir as any }, take: 1000 });
  const header = ["numara", "sigortali", "prim", "tarih"].join(",");
  const body = rows
    .map((r) => [r.number, r.holder, r.premium, r.createdAt.toISOString()].map(csvEscape).join(","))
    .join("\n");
  const csv = header + "\n" + body + "\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=policies.csv`,
    },
  });
}


