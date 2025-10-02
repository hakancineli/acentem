import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { users: { some: { email: session.user.email } } },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const yachts = await prisma.yacht.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(yachts);
  } catch (error) {
    console.error("Error fetching yachts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
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
      name,
      type,
      length,
      width,
      capacity,
      cabins,
      crew,
      year,
      location,
      port,
      dailyRate,
      weeklyRate,
      monthlyRate,
      deposit,
      features,
      images,
    } = body;

    const yacht = await prisma.yacht.create({
      data: {
        tenantId: tenant.id,
        name,
        type,
        length: parseFloat(length),
        width: parseFloat(width),
        capacity: parseInt(capacity),
        cabins: parseInt(cabins),
        crew: parseInt(crew),
        year: parseInt(year),
        location,
        port,
        dailyRate: parseInt(dailyRate),
        weeklyRate: weeklyRate ? parseInt(weeklyRate) : null,
        monthlyRate: monthlyRate ? parseInt(monthlyRate) : null,
        deposit: deposit ? parseInt(deposit) : null,
        features,
        images,
      },
    });

    return NextResponse.json(yacht);
  } catch (error) {
    console.error("Error creating yacht:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
