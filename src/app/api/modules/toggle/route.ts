import { NextResponse } from "next/server";
import type { ModuleKey } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { tenantId, key, enabled } = body as {
    tenantId?: string;
    key?: ModuleKey;
    enabled?: boolean;
  };
  if (!tenantId || !key || typeof enabled !== "boolean") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await prisma.moduleSetting.upsert({
    where: { tenantId_key: { tenantId, key } },
    create: { tenantId, key, enabled },
    update: { enabled },
  });
  return NextResponse.json({ ok: true });
}


