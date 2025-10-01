import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ModuleKey } from "@/lib/types";

export async function GET() {
  const rows = await prisma.tenant.findMany({
    include: { modules: true },
    orderBy: { createdAt: "asc" },
  });
  const tenants = rows.map((t) => {
    const record: Record<ModuleKey, boolean> = {
      dashboard: true,
      policies: true,
      offers: true,
      collections: true,
      reports: true,
      users: true,
    } as Record<ModuleKey, boolean>;
    for (const m of t.modules) {
      record[m.key as ModuleKey] = Boolean(m.enabled);
    }
    return { id: t.id, name: t.name, modules: record };
  });
  return NextResponse.json({ tenants });
}


