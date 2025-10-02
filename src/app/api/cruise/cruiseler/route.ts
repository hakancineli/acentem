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

    const cruises = await prisma.cruise.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cruises);
  } catch (error) {
    console.error("Error fetching cruises:", error);
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
      name,
      route,
      duration,
      capacity,
      price,
      description,
      itinerary,
      includes,
      excludes,
      images,
    } = body;

    const cruise = await prisma.cruise.create({
      data: {
        tenantId: tenant.id,
        name,
        route,
        duration: parseInt(duration),
        capacity: parseInt(capacity),
        price: parseInt(price),
        description,
        itinerary,
        includes,
        excludes,
        images,
      },
    });

    return NextResponse.json(cruise);
  } catch (error) {
    console.error("Error creating cruise:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
