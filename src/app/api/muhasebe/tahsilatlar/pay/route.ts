import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    let body: any;
    if (isJson) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }

    const { rentalId } = body as { rentalId?: string };
    if (!rentalId) {
      return NextResponse.json({ error: "rentalId gerekli" }, { status: 400 });
    }

    const rental = await prisma.vehicleRental.findFirst({ where: { id: rentalId, tenantId } });
    if (!rental) {
      return NextResponse.json({ error: "Kiralama bulunamadı" }, { status: 404 });
    }

    // Zaten ödenmiş mi? (reference=rental.id)
    const existing = await prisma.transaction.findFirst({ where: { tenantId, reference: rental.id, type: "income", category: "arac" } });
    if (existing) {
      return NextResponse.json({ ok: true, transaction: existing, message: "Ödeme zaten alınmış" });
    }

    const tx = await prisma.transaction.create({
      data: {
        tenantId,
        type: "income",
        category: "arac",
        amount: rental.totalAmount,
        description: `Araç kiralama ücreti (${rental.customerName})`,
        source: rental.customerName || "Müşteri",
        reference: rental.id,
        date: new Date(),
        status: "completed",
        notes: `Araç: ${rental.vehicleId}`,
      },
    });

    return NextResponse.json({ ok: true, transaction: tx });
  } catch (error) {
    console.error("tahsilat pay error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}


