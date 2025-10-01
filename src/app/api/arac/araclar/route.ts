import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const dir = searchParams.get("dir") || "desc";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    // Build where clause
    const where = {
      tenantId,
      ...(status && { status }),
      ...(type && { type }),
      ...(q && {
        OR: [
          { brand: { contains: q, mode: "insensitive" as const } },
          { model: { contains: q, mode: "insensitive" as const } },
          { plate: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    // Get vehicles with pagination
    const [vehicles, totalCount] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return NextResponse.json({
      vehicles,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Araçlar API error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    // Hem JSON hem form submit (application/x-www-form-urlencoded veya multipart) destekle
    const contentType = request.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    let body: any;
    if (isJson) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }
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
      dailyRate,
      weeklyRate,
      monthlyRate,
      deposit,
      location,
      description,
      features,
      images,
    } = body;

    if (!brand || !model || !year || !type || !fuel || !transmission || !seats || !doors || !engine || !color || !plate || !dailyRate || !location) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        brand,
        model,
        year: parseInt(String(year)),
        type,
        fuel,
        transmission,
        seats: parseInt(String(seats)),
        doors: parseInt(String(doors)),
        engine,
        color,
        plate,
        vin,
        // Fiyatlar düz TL tam sayı olarak saklanacak
        dailyRate: parseInt(String(dailyRate)),
        weeklyRate: weeklyRate ? parseInt(String(weeklyRate)) : null,
        monthlyRate: monthlyRate ? parseInt(String(monthlyRate)) : null,
        deposit: deposit ? parseInt(String(deposit)) : null,
        location,
        description,
        features,
        images,
      },
    });

    // Form submit ise liste sayfasına yönlendir
    if (!isJson) {
      return NextResponse.redirect(new URL("/arac/araclar", request.url), { status: 303 });
    }

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("Vehicle create error:", error);
    return NextResponse.json({ error: "Sunucu hatası", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
