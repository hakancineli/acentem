import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("return") || "/";

  const first = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  const res = NextResponse.redirect(new URL(returnTo, request.url));
  if (first?.id) {
    res.cookies.set("tenant-id", first.id, { path: "/", sameSite: "lax" });
  }
  return res;
}






