import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const dir = searchParams.get("dir") || "desc";
    const status = searchParams.get("status") || "";
    const hotelId = searchParams.get("hotel") || "";

    // Build where clause
    const where = {
      tenantId,
      ...(hotelId && { hotelId }),
      ...(status && { status }),
      ...(q && {
        OR: [
          { guestName: { contains: q, mode: "insensitive" as const } },
          { guestEmail: { contains: q, mode: "insensitive" as const } },
          { hotel: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }),
    };

    // Get reservations with pagination
    const [reservations, totalCount] = await Promise.all([
      prisma.hotelReservation.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          hotel: true,
        },
      }),
      prisma.hotelReservation.count({ where }),
    ]);

    return NextResponse.json({
      reservations,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Rezervasyonlar API error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const body = await request.json();
    const { 
      hotelId, 
      guestName, 
      guestEmail, 
      checkIn, 
      checkOut, 
      rooms, 
      adults, 
      children, 
      totalAmount, 
      status = "pending",
      notes 
    } = body;

    if (!hotelId || !guestName || !guestEmail || !checkIn || !checkOut || !rooms || !adults || !totalAmount) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    // Check if hotel exists and belongs to tenant
    const hotel = await prisma.hotel.findFirst({
      where: {
        id: hotelId,
        tenantId,
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Otel bulunamadı" }, { status: 404 });
    }

    const reservation = await prisma.hotelReservation.create({
      data: {
        tenantId,
        hotelId,
        guestName,
        guestEmail,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        rooms: parseInt(rooms),
        adults: parseInt(adults),
        children: parseInt(children) || 0,
        totalAmount: parseInt(totalAmount),
        status,
        notes,
      },
    });

    // Muhasebe kaydı: pending income / otel kategorisi
    const transaction = await prisma.transaction.create({
      data: {
        tenantId,
        type: "income",
        category: "otel",
        amount: parseInt(totalAmount),
        description: `Otel rezervasyon ücreti (${guestName})`,
        source: guestName || "Müşteri",
        reference: reservation.id,
        date: new Date(),
        status: "pending",
        notes: `Otel: ${hotel.name}, ${rooms} oda, ${adults} yetişkin, ${children} çocuk`,
      },
    });

    return NextResponse.json({ reservation, transaction }, { status: 201 });
  } catch (error) {
    console.error("Reservation create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

