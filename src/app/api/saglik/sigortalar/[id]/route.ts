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

    const insurance = await prisma.healthInsurance.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        _count: {
          select: { policies: true },
        },
        policies: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            policyNumber: true,
            holderName: true,
            holderEmail: true,
            premium: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!insurance) {
      return NextResponse.json({ error: "Sigorta bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(insurance);
  } catch (error) {
    console.error("Insurance get error:", error);
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
    const { provider, planName, coverage, price, isActive } = body;

    // Check if insurance exists and belongs to tenant
    const existingInsurance = await prisma.healthInsurance.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingInsurance) {
      return NextResponse.json({ error: "Sigorta bulunamadı" }, { status: 404 });
    }

    const insurance = await prisma.healthInsurance.update({
      where: { id: params.id },
      data: {
        ...(provider && { provider }),
        ...(planName && { planName }),
        ...(coverage && { coverage }),
        ...(price && { price: parseInt(price) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(insurance);
  } catch (error) {
    console.error("Insurance update error:", error);
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

    // Check if insurance exists and belongs to tenant
    const existingInsurance = await prisma.healthInsurance.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingInsurance) {
      return NextResponse.json({ error: "Sigorta bulunamadı" }, { status: 404 });
    }

    // Check if insurance has policies
    const policyCount = await prisma.healthPolicy.count({
      where: { insuranceId: params.id },
    });

    if (policyCount > 0) {
      return NextResponse.json(
        { error: "Bu sigortanın poliçeleri var, silinemez" },
        { status: 400 }
      );
    }

    await prisma.healthInsurance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Sigorta silindi" });
  } catch (error) {
    console.error("Insurance delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

