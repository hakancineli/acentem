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
    const tourId = searchParams.get("tour") || "";

    // Build where clause
    const where = {
      tenantId,
      ...(tourId && { tourId }),
      ...(status && { status }),
      ...(q && {
        OR: [
          { customerName: { contains: q, mode: "insensitive" as const } },
          { customerEmail: { contains: q, mode: "insensitive" as const } },
          { tour: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }),
    };

    // Get bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      prisma.tourBooking.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tour: true,
        },
      }),
      prisma.tourBooking.count({ where }),
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
      tourId, 
      customerName, 
      customerEmail, 
      startDate, 
      participants, 
      totalAmount, 
      status = "pending",
      notes 
    } = body;

    if (!tourId || !customerName || !customerEmail || !startDate || !participants || !totalAmount) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    // Check if tour exists and belongs to tenant
    const tour = await prisma.tour.findFirst({
      where: {
        id: tourId,
        tenantId,
      },
    });

    if (!tour) {
      return NextResponse.json({ error: "Tur bulunamadı" }, { status: 404 });
    }

    const booking = await prisma.tourBooking.create({
      data: {
        tenantId,
        tourId,
        customerName,
        customerEmail,
        startDate: new Date(startDate),
        participants: parseInt(participants),
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

