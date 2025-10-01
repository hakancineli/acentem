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
      guestName, 
      guestEmail, 
      checkIn, 
      checkOut, 
      rooms, 
      adults, 
      children, 
      totalAmount, 
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

    const reservation = await prisma.hotelReservation.update({
      where: { id },
      data: {
        ...(guestName && { guestName }),
        ...(guestEmail && { guestEmail }),
        ...(checkIn && { checkIn: new Date(checkIn) }),
        ...(checkOut && { checkOut: new Date(checkOut) }),
        ...(rooms && { rooms: parseInt(rooms) }),
        ...(adults && { adults: parseInt(adults) }),
        ...(children !== undefined && { children: parseInt(children) || 0 }),
        ...(totalAmount && { totalAmount: parseInt(totalAmount) }),
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
      
      if (existingTx) {
        voucher = await prisma.transaction.update({
          where: { id: existingTx.id },
          data: {
            amount: reservation.totalAmount,
            description: `Otel rezervasyon ücreti (${reservation.guestName})`,
            date: new Date(),
            status: "completed",
            notes: `Otel: ${existingReservation.hotel.name}, ${reservation.rooms} oda, ${reservation.adults} yetişkin, ${reservation.children} çocuk`,
          },
        });
      } else {
        voucher = await prisma.transaction.create({
          data: {
            tenantId,
            type: "income",
            category: "otel",
            amount: reservation.totalAmount,
            description: `Otel rezervasyon ücreti (${reservation.guestName})`,
            source: reservation.guestName || "Müşteri",
            reference: reservation.id,
            date: new Date(),
            status: "completed",
            notes: `Otel: ${existingReservation.hotel.name}, ${reservation.rooms} oda, ${reservation.adults} yetişkin, ${reservation.children} çocuk`,
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

