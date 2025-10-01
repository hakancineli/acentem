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
    const vehicleId = searchParams.get("vehicle") || "";

    // Build where clause
    const where = {
      tenantId,
      ...(vehicleId && { vehicleId }),
      ...(status && { status }),
      ...(q && {
        OR: [
          { customerName: { contains: q, mode: "insensitive" as const } },
          { customerPhone: { contains: q, mode: "insensitive" as const } },
          { customerEmail: { contains: q, mode: "insensitive" as const } },
          { vehicle: { brand: { contains: q, mode: "insensitive" as const } } },
          { vehicle: { model: { contains: q, mode: "insensitive" as const } } },
        ],
      }),
    };

    // Get rentals with pagination
    const [rentals, totalCount] = await Promise.all([
      prisma.vehicleRental.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vehicle: true,
        },
      }),
      prisma.vehicleRental.count({ where }),
    ]);

    return NextResponse.json({
      rentals,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Kiralamalar API error:", error);
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
      vehicleId,
      customerName,
      customerPhone,
      customerEmail,
      customerId,
      startDate,
      endDate,
      dailyRate,
      deposit,
      status = "active",
      notes,
      pickupLocation,
      returnLocation,
    } = body;

    if (!vehicleId || !customerName || !customerPhone || !startDate || !endDate || !dailyRate) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    // Check if vehicle exists and belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        tenantId,
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    // Check if vehicle is available
    if (vehicle.status !== "available") {
      return NextResponse.json({ error: "Araç müsait değil" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = days * parseInt(dailyRate);

    const rental = await prisma.vehicleRental.create({
      data: {
        tenantId,
        vehicleId,
        customerName,
        customerPhone,
        customerEmail,
        customerId,
        startDate: start,
        endDate: end,
        days,
        dailyRate: parseInt(dailyRate),
        totalAmount,
        deposit: deposit ? parseInt(deposit) : null,
        status,
        notes,
        pickupLocation,
        returnLocation,
      },
    });

    // Update vehicle status to rented
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: "rented" },
    });

    return NextResponse.json(rental, { status: 201 });
  } catch (error) {
    console.error("Rental create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
