import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const booking = await prisma.tourBooking.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        tour: true,
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
  { params }: { params: { id: string } }
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
      customerEmail, 
      startDate, 
      participants, 
      totalAmount, 
      status, 
      notes 
    } = body;

    // Check if booking exists and belongs to tenant
    const existingBooking = await prisma.tourBooking.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    const booking = await prisma.tourBooking.update({
      where: { id: params.id },
      data: {
        ...(customerName && { customerName }),
        ...(customerEmail && { customerEmail }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(participants && { participants: parseInt(participants) }),
        ...(totalAmount && { totalAmount: parseInt(totalAmount) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    // Check if booking exists and belongs to tenant
    const existingBooking = await prisma.tourBooking.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    await prisma.tourBooking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Rezervasyon silindi" });
  } catch (error) {
    console.error("Booking delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

