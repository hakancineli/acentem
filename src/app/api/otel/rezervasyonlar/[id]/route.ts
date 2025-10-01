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

    const reservation = await prisma.hotelReservation.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        hotel: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Reservation get error:", error);
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

    // Check if reservation exists and belongs to tenant
    const existingReservation = await prisma.hotelReservation.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingReservation) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    const reservation = await prisma.hotelReservation.update({
      where: { id: params.id },
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

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Reservation update error:", error);
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

    // Check if reservation exists and belongs to tenant
    const existingReservation = await prisma.hotelReservation.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingReservation) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    await prisma.hotelReservation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Rezervasyon silindi" });
  } catch (error) {
    console.error("Reservation delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

