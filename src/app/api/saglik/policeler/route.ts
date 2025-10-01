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
    const insuranceId = searchParams.get("insurance") || "";

    // Build where clause
    const where = {
      tenantId,
      ...(insuranceId && { insuranceId }),
      ...(status && { status }),
      ...(q && {
        OR: [
          { policyNumber: { contains: q, mode: "insensitive" as const } },
          { holderName: { contains: q, mode: "insensitive" as const } },
          { holderEmail: { contains: q, mode: "insensitive" as const } },
          { insurance: { provider: { contains: q, mode: "insensitive" as const } } },
          { insurance: { planName: { contains: q, mode: "insensitive" as const } } },
        ],
      }),
    };

    // Get policies with pagination
    const [policies, totalCount] = await Promise.all([
      prisma.healthPolicy.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          insurance: true,
        },
      }),
      prisma.healthPolicy.count({ where }),
    ]);

    return NextResponse.json({
      policies,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Policeler API error:", error);
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
    const { 
      insuranceId, 
      customerName, 
      customerPhone,
      customerEmail, 
      startDate, 
      endDate, 
      totalAmount, 
      status = "active",
      notes 
    } = body;

    if (!insuranceId || !customerName || !customerPhone || !startDate || !endDate || !totalAmount) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    // Check if insurance exists and belongs to tenant
    const insurance = await prisma.healthInsurance.findFirst({
      where: {
        id: insuranceId,
        tenantId,
      },
    });

    if (!insurance) {
      return NextResponse.json({ error: "Sigorta bulunamadı" }, { status: 404 });
    }

    const policy = await prisma.healthPolicy.create({
      data: {
        tenantId,
        insuranceId,
        customerName,
        customerPhone,
        customerEmail,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalAmount: parseInt(totalAmount),
        status,
        notes,
      },
    });

    // Muhasebe kaydı: pending income / saglik kategorisi
    const transaction = await prisma.transaction.create({
      data: {
        tenantId,
        type: "income",
        category: "saglik",
        amount: parseInt(totalAmount),
        description: `Sağlık sigortası primi (${customerName})`,
        source: customerName || "Müşteri",
        reference: policy.id,
        date: new Date(),
        status: "pending",
        notes: `Sigorta: ${insurance.provider} ${insurance.planName}, ${new Date(startDate).toLocaleDateString("tr-TR")} - ${new Date(endDate).toLocaleDateString("tr-TR")}`,
      },
    });

    return NextResponse.json({ policy, transaction }, { status: 201 });
  } catch (error) {
    console.error("Policy create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

