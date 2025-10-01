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
          { location: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    // Get hotels with pagination
    const [hotels, totalCount] = await Promise.all([
      prisma.hotel.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { reservations: true },
          },
        },
      }),
      prisma.hotel.count({ where }),
    ]);

    return NextResponse.json({
      hotels,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Oteller API error:", error);
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
    const { name, location, starRating, amenities, isActive = true } = body;

    if (!name || !location || !starRating) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    const hotel = await prisma.hotel.create({
      data: {
        tenantId,
        name,
        location,
        starRating: parseInt(starRating),
        amenities: amenities ? JSON.stringify(amenities) : null,
        isActive,
      },
    });

    return NextResponse.json(hotel, { status: 201 });
  } catch (error) {
    console.error("Hotel create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

