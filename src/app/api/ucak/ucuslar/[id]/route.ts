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

    const flight = await prisma.flight.findFirst({
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
            passengerName: true,
            passengerEmail: true,
            seatClass: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!flight) {
      return NextResponse.json({ error: "Uçuş bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(flight);
  } catch (error) {
    console.error("Flight get error:", error);
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
    const { airline, flightNumber, departure, arrival, departureTime, arrivalTime, price, isActive } = body;

    // Check if flight exists and belongs to tenant
    const existingFlight = await prisma.flight.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingFlight) {
      return NextResponse.json({ error: "Uçuş bulunamadı" }, { status: 404 });
    }

    const flight = await prisma.flight.update({
      where: { id: params.id },
      data: {
        ...(airline && { airline }),
        ...(flightNumber && { flightNumber }),
        ...(departure && { departure }),
        ...(arrival && { arrival }),
        ...(departureTime && { departureTime: new Date(departureTime) }),
        ...(arrivalTime && { arrivalTime: new Date(arrivalTime) }),
        ...(price && { price: parseInt(price) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(flight);
  } catch (error) {
    console.error("Flight update error:", error);
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

    // Check if flight exists and belongs to tenant
    const existingFlight = await prisma.flight.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingFlight) {
      return NextResponse.json({ error: "Uçuş bulunamadı" }, { status: 404 });
    }

    // Check if flight has bookings
    const bookingCount = await prisma.flightBooking.count({
      where: { flightId: params.id },
    });

    if (bookingCount > 0) {
      return NextResponse.json(
        { error: "Bu uçuşun rezervasyonları var, silinemez" },
        { status: 400 }
      );
    }

    await prisma.flight.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Uçuş silindi" });
  } catch (error) {
    console.error("Flight delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

