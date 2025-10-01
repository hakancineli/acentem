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
          { vehicleType: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    // Get transfers with pagination
    const [transfers, totalCount] = await Promise.all([
      prisma.transfer.findMany({
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
      prisma.transfer.count({ where }),
    ]);

    return NextResponse.json({
      transfers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Araclar API error:", error);
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
      from, 
      to, 
      vehicleType, 
      priceType,
      fixedPrice,
      pricePerKm, 
      distance, 
      duration, 
      description, 
      isActive = true 
    } = body;

    if (!from || !to || !vehicleType || !priceType) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    // Fiyat hesaplama
    let price = 0;
    if (priceType === "fixed" && fixedPrice) {
      price = parseInt(fixedPrice);
    } else if (priceType === "perKm" && pricePerKm) {
      price = parseInt(pricePerKm);
    } else {
      return NextResponse.json({ error: "Fiyat bilgisi eksik" }, { status: 400 });
    }

    // Araç tipinden kapasite çıkarma
    const getCapacityFromVehicleType = (vehicleType: string) => {
      const capacityMap: { [key: string]: number } = {
        "Sedan": 4,
        "Minivan": 8,
        "Minibüs": 16,
        "Otobüs": 45,
        "VIP Sedan": 4,
        "VIP Minivan": 8,
      };
      return capacityMap[vehicleType] || 4;
    };

    const transfer = await prisma.transfer.create({
      data: {
        tenantId,
        name: `${from} - ${to}`, // Otomatik isim oluştur
        type: "airport", // Varsayılan tip
        from,
        to,
        vehicleType,
        capacity: getCapacityFromVehicleType(vehicleType),
        price,
        distance: distance ? parseInt(distance) : null,
        duration: duration ? parseInt(duration) : null,
        description,
        isActive,
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error("Transfer create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

