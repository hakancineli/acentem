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
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Sunucu hatası", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
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
      plateNumber,
      vehicleType,
      brand,
      model,
      year,
      color,
      capacity,
      fuelType,
      driverName,
      driverPhone,
      driverLicense,
      isActive = true,
      notes
    } = body;

    if (!plateNumber || !vehicleType || !brand || !model || !driverName || !driverPhone) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
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
        name: `${brand} ${model} - ${plateNumber}`, // Araç bilgileri ile isim oluştur
        type: "company_vehicle", // Şirket aracı tipi
        from: "Şirket Filosu", // Varsayılan
        to: "Şirket Filosu", // Varsayılan
        vehicleType,
        capacity: capacity ? parseInt(capacity) : getCapacityFromVehicleType(vehicleType),
        price: 0, // Fiyat rezervasyon sırasında belirlenir
        distance: null,
        duration: null,
        description: `Plaka: ${plateNumber}\nMarka: ${brand}\nModel: ${model}\nYıl: ${year || 'Belirtilmemiş'}\nRenk: ${color || 'Belirtilmemiş'}\nYakıt: ${fuelType || 'Belirtilmemiş'}\nŞoför: ${driverName}\nTelefon: ${driverPhone}\nEhliyet: ${driverLicense || 'Belirtilmemiş'}\nNotlar: ${notes || 'Yok'}`,
        isActive,
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error("Transfer create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

