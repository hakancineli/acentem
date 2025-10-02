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

    const sales = await prisma.propertySale.findMany({
      where: { tenantId: tenant.id },
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching property sales:", error);
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
      saleDate,
      salePrice,
      notes,
    } = body;

    const sale = await prisma.propertySale.create({
      data: {
        tenantId: tenant.id,
        propertyId,
        customerName,
        customerPhone,
        customerEmail,
        saleDate: new Date(saleDate),
        salePrice: parseInt(salePrice),
        notes,
      },
    });

    // Muhasebe için transaction oluştur
    await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        type: "income",
        category: "emlak",
        amount: parseInt(salePrice),
        description: `Emlak satış ücreti (${customerName})`,
        source: customerName,
        reference: sale.id,
        status: "completed", // Satış işlemi genelde hemen tamamlanır
        notes: `Emlak: ${sale.property?.title || 'Bilinmeyen'}`,
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error creating property sale:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
