import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { users: { some: { email: session.user.email } } },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const bookings = await prisma.cruiseBooking.findMany({
      where: { tenantId: tenant.id },
      include: { cruise: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching cruise bookings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { users: { some: { email: session.user.email } } },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      cruiseId,
      customerName,
      customerPhone,
      customerEmail,
      startDate,
      participants,
      totalAmount,
      notes,
    } = body;

    const booking = await prisma.cruiseBooking.create({
      data: {
        tenantId: tenant.id,
        cruiseId,
        customerName,
        customerPhone,
        customerEmail,
        startDate: new Date(startDate),
        participants: parseInt(participants),
        totalAmount: parseInt(totalAmount),
        notes,
      },
    });

    // Muhasebe için transaction oluştur
    await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        type: "income",
        category: "cruise",
        amount: parseInt(totalAmount),
        description: `Cruise rezervasyon ücreti (${customerName})`,
        source: customerName,
        reference: booking.id,
        status: "pending",
        notes: `Cruise: ${booking.cruise?.name || 'Bilinmeyen'}`,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error creating cruise booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
