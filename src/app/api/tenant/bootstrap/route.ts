import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  let returnTo = url.searchParams.get("return") || "/";

  // URL'yi decode et
  try {
    returnTo = decodeURIComponent(returnTo);
  } catch (e) {
    // Decode hatası durumunda orijinal değeri kullan
  }

  // Sonsuz döngüyü önle - bootstrap içeren tüm URL'leri ana sayfaya yönlendir
  if (returnTo.includes("bootstrap")) {
    returnTo = "/";
  }

  const first = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  const res = NextResponse.redirect(new URL(returnTo, request.url));
  if (first?.id) {
    res.cookies.set("tenant-id", first.id, { path: "/", sameSite: "lax" });
  }
  return res;
}






