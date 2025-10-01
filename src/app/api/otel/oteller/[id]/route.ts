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

    const hotel = await prisma.hotel.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        _count: {
          select: { reservations: true },
        },
        reservations: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            guestName: true,
            guestEmail: true,
            checkIn: true,
            checkOut: true,
            rooms: true,
            adults: true,
            children: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Otel bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(hotel);
  } catch (error) {
    console.error("Hotel get error:", error);
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
    const { name, location, starRating, amenities, isActive } = body;

    // Check if hotel exists and belongs to tenant
    const existingHotel = await prisma.hotel.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingHotel) {
      return NextResponse.json({ error: "Otel bulunamadı" }, { status: 404 });
    }

    const hotel = await prisma.hotel.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(starRating && { starRating: parseInt(starRating) }),
        ...(amenities !== undefined && { amenities: amenities ? JSON.stringify(amenities) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(hotel);
  } catch (error) {
    console.error("Hotel update error:", error);
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

    // Check if hotel exists and belongs to tenant
    const existingHotel = await prisma.hotel.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingHotel) {
      return NextResponse.json({ error: "Otel bulunamadı" }, { status: 404 });
    }

    // Check if hotel has reservations
    const reservationCount = await prisma.hotelReservation.count({
      where: { hotelId: params.id },
    });

    if (reservationCount > 0) {
      return NextResponse.json(
        { error: "Bu otelin rezervasyonları var, silinemez" },
        { status: 400 }
      );
    }

    await prisma.hotel.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Otel silindi" });
  } catch (error) {
    console.error("Hotel delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

