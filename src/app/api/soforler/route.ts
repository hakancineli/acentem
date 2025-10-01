import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const drivers = await prisma.driver.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Drivers get error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const body = await request.json();
    const { name, phone, commission } = body;

    if (!name || !phone || commission === undefined) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur" }, { status: 400 });
    }

    if (commission < 0 || commission > 100) {
      return NextResponse.json({ error: "Komisyon oranı 0-100 arasında olmalıdır" }, { status: 400 });
    }

    const driver = await prisma.driver.create({
      data: {
        tenantId,
        name,
        phone,
        commission,
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Driver create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
