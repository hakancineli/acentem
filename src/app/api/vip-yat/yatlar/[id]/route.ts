import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const yacht = await prisma.yacht.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        rentals: true,
        bookings: true,
      },
    });

    if (!yacht) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    return NextResponse.json(yacht);
  } catch (error) {
    console.error("Error fetching yacht:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      isActive,
    } = body;

    const yacht = await prisma.yacht.update({
      where: { id, tenantId: tenant.id },
      data: {
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
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(yacht);
  } catch (error) {
    console.error("Error updating yacht:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    await prisma.yacht.delete({
      where: { id, tenantId: tenant.id },
    });

    return NextResponse.json({ message: "Yacht deleted successfully" });
  } catch (error) {
    console.error("Error deleting yacht:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
