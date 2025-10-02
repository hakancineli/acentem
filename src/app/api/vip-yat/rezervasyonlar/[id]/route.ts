import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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

    const booking = await prisma.yachtBooking.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        yacht: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Booking fetch error:", error);
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
      startDate,
      endDate,
      currency,
      notes,
      status
    } = body;

    const { id } = await params;

    const existingBooking = await prisma.yachtBooking.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        yacht: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    // Calculate days if dates changed
    const calculatedDays = startDate && endDate 
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      : existingBooking.days;

    const booking = await prisma.yachtBooking.update({
      where: { id },
      data: {
        ...(customerName && { customerName }),
        ...(customerPhone && { customerPhone }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(currency && { currency }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        ...(startDate && endDate && { days: calculatedDays }),
      },
    });

    let voucher: any = null;

    if (status === "confirmed" || status === "completed") {
      const existingTx = await prisma.transaction.findFirst({ 
        where: { tenantId, reference: booking.id } 
      });
      
      if (existingTx) {
        voucher = await prisma.transaction.update({
          where: { id: existingTx.id },
          data: {
            status: status === "confirmed" || status === "completed" ? "completed" : "pending",
            notes: `VIP Yat rezervasyon ücreti (${booking.customerName})`,
            amount: booking.totalPrice,
            currency: booking.currency,
            exchangeRate: booking.exchangeRate,
            amountTRY: booking.currency !== "TRY" ? booking.totalPrice * (booking.exchangeRate || 1) : booking.totalPrice,
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

    const booking = await prisma.yachtBooking.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}