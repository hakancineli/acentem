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
          { name: { contains: q, mode: "insensitive" as const } },
          { destination: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    // Get tours with pagination
    const [tours, totalCount] = await Promise.all([
      prisma.tour.findMany({
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
      prisma.tour.count({ where }),
    ]);

    return NextResponse.json({
      tours,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Turlar API error:", error);
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
    const { name, destination, duration, price, description, isActive = true } = body;

    if (!name || !destination || !duration || !price) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    const tour = await prisma.tour.create({
      data: {
        tenantId,
        name,
        destination,
        duration: parseInt(duration),
        price: parseInt(price),
        description,
        isActive,
      },
    });

    return NextResponse.json(tour, { status: 201 });
  } catch (error) {
    console.error("Tour create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

