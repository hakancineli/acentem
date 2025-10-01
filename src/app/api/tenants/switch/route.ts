import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { tenantId } = body as { tenantId?: string };
  const found = tenantId ? await prisma.tenant.findUnique({ where: { id: tenantId } }) : null;
  if (!found) return NextResponse.json({ ok: false }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("tenant-id", found.id, { path: "/", sameSite: "lax" });
  return res;
}


