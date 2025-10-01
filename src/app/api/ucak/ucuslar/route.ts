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

    // Build where clause
    const where = {
      tenantId,
      ...(q && {
        OR: [
          { airline: { contains: q, mode: "insensitive" as const } },
          { flightNumber: { contains: q, mode: "insensitive" as const } },
          { departure: { contains: q, mode: "insensitive" as const } },
          { arrival: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    // Get flights with pagination
    const [flights, totalCount] = await Promise.all([
      prisma.flight.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      }),
      prisma.flight.count({ where }),
    ]);

    return NextResponse.json({
      flights,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Ucuslar API error:", error);
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
    const { airline, flightNumber, departure, arrival, departureTime, arrivalTime, price, isActive = true } = body;

    if (!airline || !flightNumber || !departure || !arrival || !departureTime || !arrivalTime || !price) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    const flight = await prisma.flight.create({
      data: {
        tenantId,
        airline,
        flightNumber,
        departure,
        arrival,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        price: parseInt(price),
        isActive,
      },
    });

    return NextResponse.json(flight, { status: 201 });
  } catch (error) {
    console.error("Flight create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

