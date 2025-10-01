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
    const flightId = searchParams.get("flight") || "";

    // Build where clause
    const where = {
      tenantId,
      ...(flightId && { flightId }),
      ...(status && { status }),
      ...(q && {
        OR: [
          { passengerName: { contains: q, mode: "insensitive" as const } },
          { passengerEmail: { contains: q, mode: "insensitive" as const } },
          { flight: { airline: { contains: q, mode: "insensitive" as const } } },
          { flight: { flightNumber: { contains: q, mode: "insensitive" as const } } },
        ],
      }),
    };

    // Get bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      prisma.flightBooking.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          flight: true,
        },
      }),
      prisma.flightBooking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
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
      flightId, 
      passengerName, 
      passengerEmail, 
      seatClass, 
      totalAmount, 
      status = "pending",
      notes 
    } = body;

    if (!flightId || !passengerName || !passengerEmail || !seatClass || !totalAmount) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    // Check if flight exists and belongs to tenant
    const flight = await prisma.flight.findFirst({
      where: {
        id: flightId,
        tenantId,
      },
    });

    if (!flight) {
      return NextResponse.json({ error: "Uçuş bulunamadı" }, { status: 404 });
    }

    const booking = await prisma.flightBooking.create({
      data: {
        tenantId,
        flightId,
        passengerName,
        passengerEmail,
        seatClass,
        totalAmount: parseInt(totalAmount),
        status,
        notes,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Booking create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

