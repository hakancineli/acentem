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
          { customerName: { contains: q, mode: "insensitive" as const } },
          { customerPhone: { contains: q, mode: "insensitive" as const } },
          { customerEmail: { contains: q, mode: "insensitive" as const } },
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
      status = "pending",
      notes 
    } = body;

    if (!hotelId || !customerName || !customerPhone || !checkIn || !checkOut || !rooms || !adults || !totalAmount) {
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

    // Kapora hesaplama
    const calculatedDepositAmount = paymentTiming === "kapora" && depositAmount ? parseInt(depositAmount) : parseInt(totalAmount);
    const calculatedRemainingAmount = paymentTiming === "kapora" && depositAmount ? parseInt(totalAmount) - parseInt(depositAmount) : 0;

    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));

    const reservation = await prisma.hotelReservation.create({
      data: {
        tenantId,
        hotelId,
        customerName,
        customerPhone,
        customerEmail,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        nights,
        rooms: parseInt(rooms),
        adults: parseInt(adults),
        children: parseInt(children) || 0,
        totalAmount: parseInt(totalAmount),
        paymentMethod,
        collectionMethod,
        paymentTiming,
        depositAmount: calculatedDepositAmount,
        remainingAmount: calculatedRemainingAmount,
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
        amount: calculatedDepositAmount, // İlk aşamada kapora veya tam tutar
        description: `Otel rezervasyon ücreti (${customerName})`,
        source: customerName || "Müşteri",
        reference: reservation.id,
        date: new Date(),
        status: "pending",
        notes: `Otel: ${hotel.name}, ${rooms} oda, ${adults} yetişkin, ${children || 0} çocuk, ${nights} gece. Ödeme: ${paymentMethod || 'Belirtilmedi'}, Tahsilat: ${collectionMethod || 'Belirtilmedi'}`,
      },
    });

    return NextResponse.json({ reservation, transaction }, { status: 201 });
  } catch (error) {
    console.error("Reservation create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

