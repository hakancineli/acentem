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

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Vehicle get error:", error);
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
    const {
      brand,
      model,
      year,
      type,
      fuel,
      transmission,
      seats,
      doors,
      engine,
      color,
      plate,
      vin,
      status,
      dailyRate,
      weeklyRate,
      monthlyRate,
      deposit,
      location,
      description,
      features,
      images,
      isActive,
    } = body;

    // Check if vehicle exists and belongs to tenant
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingVehicle) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        brand,
        model,
        year: year ? parseInt(year) : undefined,
        type,
        fuel,
        transmission,
        seats: seats ? parseInt(seats) : undefined,
        doors: doors ? parseInt(doors) : undefined,
        engine,
        color,
        plate,
        vin,
        status,
        dailyRate: dailyRate ? parseInt(dailyRate) : undefined,
        weeklyRate: weeklyRate ? parseInt(weeklyRate) : null,
        monthlyRate: monthlyRate ? parseInt(monthlyRate) : null,
        deposit: deposit ? parseInt(deposit) : null,
        location,
        description,
        features,
        images,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Vehicle update error:", error);
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

    // Check if vehicle exists and belongs to tenant
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingVehicle) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    // Check if vehicle has active rentals or bookings
    const [activeRentals, activeBookings] = await Promise.all([
      prisma.vehicleRental.count({
        where: {
          vehicleId: params.id,
          status: { in: ["active"] },
        },
      }),
      prisma.vehicleBooking.count({
        where: {
          vehicleId: params.id,
          status: { in: ["pending", "confirmed"] },
        },
      }),
    ]);

    if (activeRentals > 0 || activeBookings > 0) {
      return NextResponse.json(
        { error: "Aktif kiralama veya rezervasyonu olan araç silinemez" },
        { status: 400 }
      );
    }

    await prisma.vehicle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Araç başarıyla silindi" });
  } catch (error) {
    console.error("Vehicle delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
