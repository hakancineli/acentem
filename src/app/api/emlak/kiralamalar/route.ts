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

    const rentals = await prisma.propertyRental.findMany({
      where: { tenantId: tenant.id },
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rentals);
  } catch (error) {
    console.error("Error fetching property rentals:", error);
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
      propertyId,
      customerName,
      customerPhone,
      customerEmail,
      startDate,
      endDate,
      totalAmount,
      notes,
    } = body;

    const rental = await prisma.propertyRental.create({
      data: {
        tenantId: tenant.id,
        propertyId,
        customerName,
        customerPhone,
        customerEmail,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalAmount: parseInt(totalAmount),
        notes,
      },
    });

    // Muhasebe için transaction oluştur
    await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        type: "income",
        category: "emlak",
        amount: parseInt(totalAmount),
        description: `Emlak kiralama ücreti (${customerName})`,
        source: customerName,
        reference: rental.id,
        status: "pending",
        notes: `Emlak: ${rental.property?.title || 'Bilinmeyen'}`,
      },
    });

    return NextResponse.json(rental);
  } catch (error) {
    console.error("Error creating property rental:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
