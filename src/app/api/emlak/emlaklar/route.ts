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

    const properties = await prisma.property.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
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
      title,
      type,
      location,
      city,
      district,
      neighborhood,
      address,
      rooms,
      bathrooms,
      area,
      floor,
      buildingAge,
      heating,
      parking,
      balcony,
      elevator,
      furnished,
      rentPrice,
      salePrice,
      description,
      features,
      images,
    } = body;

    const property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        title,
        type,
        location,
        city,
        district,
        neighborhood,
        address,
        rooms: parseInt(rooms),
        bathrooms: parseInt(bathrooms),
        area: parseFloat(area),
        floor: floor ? parseInt(floor) : null,
        buildingAge: buildingAge ? parseInt(buildingAge) : null,
        heating,
        parking,
        balcony,
        elevator,
        furnished,
        rentPrice: rentPrice ? parseInt(rentPrice) : null,
        salePrice: salePrice ? parseInt(salePrice) : null,
        description,
        features,
        images,
      },
    });

    return NextResponse.json(property);
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
