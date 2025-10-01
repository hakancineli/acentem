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

    // Build where clause
    const where = {
      tenantId,
      ...(q && {
        OR: [
          { provider: { contains: q, mode: "insensitive" as const } },
          { planName: { contains: q, mode: "insensitive" as const } },
          { coverage: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    // Get insurances with pagination
    const [insurances, totalCount] = await Promise.all([
      prisma.healthInsurance.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { policies: true },
          },
        },
      }),
      prisma.healthInsurance.count({ where }),
    ]);

    return NextResponse.json({
      insurances,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Sigortalar API error:", error);
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

    const body = await request.json();
    const { provider, planName, coverage, price, isActive = true } = body;

    if (!provider || !planName || !coverage || !price) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    const insurance = await prisma.healthInsurance.create({
      data: {
        tenantId,
        provider,
        planName,
        coverage,
        price: parseInt(price),
        isActive,
      },
    });

    return NextResponse.json(insurance, { status: 201 });
  } catch (error) {
    console.error("Insurance create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

