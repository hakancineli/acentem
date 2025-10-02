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

    const rentals = await prisma.yachtRental.findMany({
      where: { tenantId: tenant.id },
      include: { yacht: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rentals);
  } catch (error) {
    console.error("Error fetching yacht rentals:", error);
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
      yachtId,
      customerName,
      customerPhone,
      customerEmail,
      startDate,
      endDate,
      days,
      totalAmount,
      notes,
    } = body;

    const rental = await prisma.yachtRental.create({
      data: {
        tenantId: tenant.id,
        yachtId,
        customerName,
        customerPhone,
        customerEmail,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: parseInt(days),
        totalAmount: parseInt(totalAmount),
        notes,
      },
    });

    // Muhasebe için transaction oluştur
    await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        type: "income",
        category: "vip_yat",
        amount: parseInt(totalAmount),
        description: `Yat kiralama ücreti (${customerName})`,
        source: customerName,
        reference: rental.id,
        status: "pending",
        notes: `Yat: ${rental.yacht?.name || 'Bilinmeyen'}`,
      },
    });

    return NextResponse.json(rental);
  } catch (error) {
    console.error("Error creating yacht rental:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
