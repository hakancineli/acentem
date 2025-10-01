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

    const tour = await prisma.tour.findFirst({
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
            customerEmail: true,
            startDate: true,
            participants: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!tour) {
      return NextResponse.json({ error: "Tur bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(tour);
  } catch (error) {
    console.error("Tour get error:", error);
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
    const { name, destination, duration, price, description, isActive } = body;

    // Check if tour exists and belongs to tenant
    const existingTour = await prisma.tour.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingTour) {
      return NextResponse.json({ error: "Tur bulunamadı" }, { status: 404 });
    }

    const tour = await prisma.tour.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(destination && { destination }),
        ...(duration && { duration: parseInt(duration) }),
        ...(price && { price: parseInt(price) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(tour);
  } catch (error) {
    console.error("Tour update error:", error);
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

    // Check if tour exists and belongs to tenant
    const existingTour = await prisma.tour.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingTour) {
      return NextResponse.json({ error: "Tur bulunamadı" }, { status: 404 });
    }

    // Check if tour has bookings
    const bookingCount = await prisma.tourBooking.count({
      where: { tourId: params.id },
    });

    if (bookingCount > 0) {
      return NextResponse.json(
        { error: "Bu turun rezervasyonları var, silinemez" },
        { status: 400 }
      );
    }

    await prisma.tour.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Tur silindi" });
  } catch (error) {
    console.error("Tour delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

