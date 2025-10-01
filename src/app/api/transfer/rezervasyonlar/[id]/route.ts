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

    const booking = await prisma.transferBooking.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(booking);
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
      customerName, 
      customerPhone, 
      customerEmail,
      pickupLocation, 
      dropoffLocation, 
      pickupDate, 
      passengerCount,
      passengers,
      totalAmount, 
      currency,
      driverId,
      driverCommission,
      driverPaid,
      paymentMethod,
      status, 
      notes 
    } = body;

    const { id } = await params;

    // Check if booking exists and belongs to tenant
    const existingBooking = await prisma.transferBooking.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    const booking = await prisma.transferBooking.update({
      where: { id },
      data: {
        ...(customerName && { customerName }),
        ...(customerPhone && { customerPhone }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(pickupLocation && { pickupLocation }),
        ...(dropoffLocation && { dropoffLocation }),
        ...(pickupDate && { pickupDate: new Date(pickupDate) }),
        ...(passengerCount && { passengerCount: parseInt(passengerCount) }),
        ...(passengers && { passengers }),
        ...(totalAmount && { totalAmount: parseInt(totalAmount) }),
        ...(currency && { currency }),
        ...(driverId !== undefined && { driverId: driverId || null }),
        ...(driverCommission && { driverCommission: parseInt(driverCommission) }),
        ...(driverPaid !== undefined && { driverPaid }),
        ...(paymentMethod && { paymentMethod }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    let voucher: any = null;

    // Tamamlandığında: transfer gelir fişi (voucher) oluştur
    if (status === "completed") {
      // Muhasebe kaydı: income / transfer kategorisi
      // Mevcut fiş varsa güncelle, yoksa oluştur
      const existingTx = await prisma.transaction.findFirst({ 
        where: { tenantId, reference: booking.id } 
      });
      
      if (existingTx) {
        voucher = await prisma.transaction.update({
          where: { id: existingTx.id },
          data: {
            amount: booking.totalAmount,
            description: `Transfer ücreti (${booking.customerName})`,
            date: new Date(),
            status: "completed",
            notes: `Transfer: ${booking.pickupLocation} → ${booking.dropoffLocation}`,
          },
        });
      } else {
        voucher = await prisma.transaction.create({
          data: {
            tenantId,
            type: "income",
            category: "transfer",
            amount: booking.totalAmount,
            description: `Transfer ücreti (${booking.customerName})`,
            source: booking.customerName || "Müşteri",
            reference: booking.id,
            date: new Date(),
            status: "completed",
            notes: `Transfer: ${booking.pickupLocation} → ${booking.dropoffLocation}`,
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
    const existingBooking = await prisma.transferBooking.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    await prisma.transferBooking.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Rezervasyon silindi" });
  } catch (error) {
    console.error("Booking delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

