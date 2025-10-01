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

    const booking = await prisma.flightBooking.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        flight: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Booking get error:", error);
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
      passengerName, 
      passengerEmail, 
      seatClass, 
      totalAmount, 
      status, 
      notes 
    } = body;

    const { id } = await params;

    // Check if booking exists and belongs to tenant
    const existingBooking = await prisma.flightBooking.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        flight: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    const booking = await prisma.flightBooking.update({
      where: { id },
      data: {
        ...(passengerName && { passengerName }),
        ...(passengerEmail && { passengerEmail }),
        ...(seatClass && { seatClass }),
        ...(totalAmount && { totalAmount: parseInt(totalAmount) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    let voucher: any = null;

    // Onaylandığında: uçak gelir fişi (voucher) oluştur
    if (status === "confirmed") {
      // Muhasebe kaydı: income / ucak kategorisi
      // Mevcut fiş varsa güncelle, yoksa oluştur
      const existingTx = await prisma.transaction.findFirst({ 
        where: { tenantId, reference: booking.id } 
      });
      
      if (existingTx) {
        voucher = await prisma.transaction.update({
          where: { id: existingTx.id },
          data: {
            amount: booking.totalAmount,
            description: `Uçak rezervasyon ücreti (${booking.passengerName})`,
            date: new Date(),
            status: "completed",
            notes: `Uçuş: ${existingBooking.flight.airline} ${existingBooking.flight.flightNumber}, ${booking.seatClass} sınıf`,
          },
        });
      } else {
        voucher = await prisma.transaction.create({
          data: {
            tenantId,
            type: "income",
            category: "ucak",
            amount: booking.totalAmount,
            description: `Uçak rezervasyon ücreti (${booking.passengerName})`,
            source: booking.passengerName || "Müşteri",
            reference: booking.id,
            date: new Date(),
            status: "completed",
            notes: `Uçuş: ${existingBooking.flight.airline} ${existingBooking.flight.flightNumber}, ${booking.seatClass} sınıf`,
          },
        });
      }
    }

    return NextResponse.json({ booking, voucher });
  } catch (error) {
    console.error("Booking update error:", error);
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

    // Check if booking exists and belongs to tenant
    const existingBooking = await prisma.flightBooking.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    await prisma.flightBooking.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Rezervasyon silindi" });
  } catch (error) {
    console.error("Booking delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

