import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }
    const { id } = await context.params;
    const rental = await prisma.vehicleRental.findFirst({
      where: { id, tenantId },
      include: { vehicle: true },
    });
    if (!rental) return NextResponse.json({ error: "Kiralama bulunamadı" }, { status: 404 });
    return NextResponse.json(rental);
  } catch (error) {
    console.error("Rental get error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const body = await request.json();
    const { status, notes } = body as { status?: string; notes?: string };

    // Kiralama var mı ve bu tenant'a mı ait?
    const { id } = await context.params;
    const rental = await prisma.vehicleRental.findFirst({
      where: { id, tenantId },
    });

    if (!rental) {
      return NextResponse.json({ error: "Kiralama bulunamadı" }, { status: 404 });
    }

    // Güncelleme verisi hazırla
    const updateData: any = {};
    if (typeof status === "string" && status.length > 0) {
      updateData.status = status;
    }
    if (typeof notes === "string") {
      updateData.notes = notes;
    }

    // Kiralamayı güncelle
    const updated = await prisma.vehicleRental.update({
      where: { id: rental.id },
      data: updateData,
    });

    let voucher: any = null;

    // Tamamlandığında: aracı müsait yap + gelir fişi (voucher) oluştur
    if (updateData.status === "completed") {
      // Aracı tekrar müsait yap
      await prisma.vehicle.update({
        where: { id: rental.vehicleId },
        data: { status: "available" },
      });

      // Muhasebe kaydı: income / araç kategorisi
      // Mevcut fiş varsa güncelle, yoksa oluştur
      const existingTx = await prisma.transaction.findFirst({ where: { tenantId, reference: rental.id } });
      if (existingTx) {
        voucher = await prisma.transaction.update({
          where: { id: existingTx.id },
          data: {
            amount: updated.totalAmount,
            description: `Araç kiralama ücreti (${updated.customerName})`,
            date: new Date(),
            status: "completed",
            notes: `Araç: ${rental.vehicleId}${updated.deposit ? `, Depozito: ${updated.deposit}` : ""}`,
          },
        });
      } else {
        voucher = await prisma.transaction.create({
          data: {
            tenantId,
            type: "income",
            category: "arac",
            amount: updated.totalAmount,
            description: `Araç kiralama ücreti (${updated.customerName})`,
            source: updated.customerName || "Müşteri",
            reference: rental.id,
            date: new Date(),
            status: "completed",
            notes: `Araç: ${rental.vehicleId}${updated.deposit ? `, Depozito: ${updated.deposit}` : ""}`,
          },
        });
      }
    }

    return NextResponse.json({ rental: updated, voucher });
  } catch (error) {
    console.error("Rental update error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}


