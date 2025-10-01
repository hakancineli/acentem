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
    const transferId = searchParams.get("transfer") || "";

    // Build where clause
    const where = {
      tenantId,
      ...(transferId && { transferId }),
      ...(status && { status }),
      ...(q && {
        OR: [
          { customerName: { contains: q, mode: "insensitive" as const } },
          { customerPhone: { contains: q, mode: "insensitive" as const } },
          { pickupLocation: { contains: q, mode: "insensitive" as const } },
          { dropoffLocation: { contains: q, mode: "insensitive" as const } },
          { transfer: { vehicleType: { contains: q, mode: "insensitive" as const } } },
        ],
      }),
    };

    // Get bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      prisma.transferBooking.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          transfer: true,
        },
      }),
      prisma.transferBooking.count({ where }),
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
      transferId, 
      customerName, 
      customerPhone, 
      pickupLocation, 
      dropoffLocation, 
      pickupDate, 
      distance, 
      totalAmount, 
      status = "pending",
      notes 
    } = body;

    if (!transferId || !customerName || !customerPhone || !pickupLocation || !dropoffLocation || !pickupDate || !totalAmount) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    // Check if transfer exists and belongs to tenant
    const transfer = await prisma.transfer.findFirst({
      where: {
        id: transferId,
        tenantId,
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    const booking = await prisma.transferBooking.create({
      data: {
        tenantId,
        transferId,
        customerName,
        customerPhone,
        pickupLocation,
        dropoffLocation,
        pickupDate: new Date(pickupDate),
        distance: distance ? parseInt(distance) : null,
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

