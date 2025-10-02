import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const { id } = await params;

    const reservation = await prisma.hotelReservation.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        hotel: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("Reservation get error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const body = await request.json();
    const { 
      customerName, 
      customerPhone,
      customerEmail, 
      checkIn, 
      checkOut, 
      rooms, 
      adults, 
      children, 
      totalAmount,
      paymentMethod,
      collectionMethod,
      paymentTiming,
      depositAmount,
      status, 
      notes 
    } = body;

    const { id } = await params;

    // Check if reservation exists and belongs to tenant
    const existingReservation = await prisma.hotelReservation.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        hotel: true,
      },
    });

    if (!existingReservation) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    // Kapora hesaplama
    const calculatedDepositAmount = paymentTiming === "kapora" && depositAmount ? parseInt(depositAmount) : (totalAmount ? parseInt(totalAmount) : existingReservation.totalAmount);
    const calculatedRemainingAmount = paymentTiming === "kapora" && depositAmount && totalAmount ? parseInt(totalAmount) - parseInt(depositAmount) : 0;
    
    const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : existingReservation.nights;

    const reservation = await prisma.hotelReservation.update({
      where: { id },
      data: {
        ...(customerName && { customerName }),
        ...(customerPhone && { customerPhone }),
        ...(customerEmail && { customerEmail }),
        ...(checkIn && { checkIn: new Date(checkIn) }),
        ...(checkOut && { checkOut: new Date(checkOut) }),
        ...(nights && { nights }),
        ...(rooms && { rooms: parseInt(rooms) }),
        ...(adults && { adults: parseInt(adults) }),
        ...(children !== undefined && { children: parseInt(children) || 0 }),
        ...(totalAmount && { totalAmount: parseInt(totalAmount) }),
        ...(paymentMethod && { paymentMethod }),
        ...(collectionMethod && { collectionMethod }),
        ...(paymentTiming && { paymentTiming }),
        ...(paymentTiming && { depositAmount: calculatedDepositAmount }),
        ...(paymentTiming && { remainingAmount: calculatedRemainingAmount }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    let voucher: any = null;

    // Onaylandığında: otel gelir fişi (voucher) oluştur
    if (status === "confirmed") {
      // Muhasebe kaydı: income / otel kategorisi
      // Mevcut fiş varsa güncelle, yoksa oluştur
      const existingTx = await prisma.transaction.findFirst({ 
        where: { tenantId, reference: reservation.id } 
      });
      // amountTRY hesapla (çoklu para birimi)
      const amountBase = reservation.totalAmount;
      const exch = reservation.exchangeRate || 1;
      const amountTRY = reservation.currency === "TRY" ? amountBase : amountBase * exch;
      // müşteri adı (ilk kişi)
      let primaryName = "Müşteri";
      try {
        const customers = JSON.parse((existingReservation as any).customers || "[]");
        if (Array.isArray(customers) && customers[0]?.name) primaryName = customers[0].name;
      } catch {}
      
      if (existingTx) {
        voucher = await prisma.transaction.update({
          where: { id: existingTx.id },
          data: {
            amount: reservation.totalAmount,
            currency: reservation.currency || "TRY",
            exchangeRate: reservation.exchangeRate || 1,
            amountTRY,
            description: `Otel rezervasyon ücreti (${primaryName})`,
            date: new Date(),
            status: "completed",
            notes: `Otel: ${existingReservation.hotel.name}, ${reservation.rooms} oda, ${reservation.adults} yetişkin, ${reservation.children} çocuk, ${reservation.nights} gece. Ödeme: ${reservation.paymentMethod || 'Belirtilmedi'}, Tahsilat: ${reservation.collectionMethod || 'Belirtilmedi'}`,
          },
        });
      } else {
        voucher = await prisma.transaction.create({
          data: {
            tenantId,
            type: "income",
            category: "otel",
            amount: reservation.totalAmount,
            currency: reservation.currency || "TRY",
            exchangeRate: reservation.exchangeRate || 1,
            amountTRY,
            description: `Otel rezervasyon ücreti (${primaryName})`,
            source: primaryName,
            reference: reservation.id,
            date: new Date(),
            status: "completed",
            notes: `Otel: ${existingReservation.hotel.name}, ${reservation.rooms} oda, ${reservation.adults} yetişkin, ${reservation.children} çocuk, ${reservation.nights} gece. Ödeme: ${reservation.paymentMethod || 'Belirtilmedi'}, Tahsilat: ${reservation.collectionMethod || 'Belirtilmedi'}`,
          },
        });
      }
    }

    return NextResponse.json({ reservation, voucher });
  } catch (error) {
    console.error("Reservation update error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const { id } = await params;

    // Check if reservation exists and belongs to tenant
    const existingReservation = await prisma.hotelReservation.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingReservation) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    await prisma.hotelReservation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Rezervasyon silindi" });
  } catch (error) {
    console.error("Reservation delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

