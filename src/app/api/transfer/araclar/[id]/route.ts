import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const transfer = await prisma.transfer.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
        bookings: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            pickupLocation: true,
            dropoffLocation: true,
            pickupDate: true,
            distance: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(transfer);
  } catch (error) {
    console.error("Transfer get error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const body = await request.json();
    const { vehicleType, capacity, pricePerKm, isActive } = body;

    // Check if transfer exists and belongs to tenant
    const existingTransfer = await prisma.transfer.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingTransfer) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    const transfer = await prisma.transfer.update({
      where: { id: params.id },
      data: {
        ...(vehicleType && { vehicleType }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(pricePerKm && { pricePerKm: parseInt(pricePerKm) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(transfer);
  } catch (error) {
    console.error("Transfer update error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    // Check if transfer exists and belongs to tenant
    const existingTransfer = await prisma.transfer.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingTransfer) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    // Check if transfer has bookings
    const bookingCount = await prisma.transferBooking.count({
      where: { transferId: params.id },
    });

    if (bookingCount > 0) {
      return NextResponse.json(
        { error: "Bu aracın rezervasyonları var, silinemez" },
        { status: 400 }
      );
    }

    await prisma.transfer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Araç silindi" });
  } catch (error) {
    console.error("Transfer delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

