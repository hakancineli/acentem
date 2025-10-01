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

    const policy = await prisma.healthPolicy.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        insurance: true,
      },
    });

    if (!policy) {
      return NextResponse.json({ error: "Poliçe bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Policy get error:", error);
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
      policyNumber, 
      holderName, 
      holderEmail, 
      startDate, 
      endDate, 
      premium, 
      status, 
      notes 
    } = body;

    // Check if policy exists and belongs to tenant
    const existingPolicy = await prisma.healthPolicy.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingPolicy) {
      return NextResponse.json({ error: "Poliçe bulunamadı" }, { status: 404 });
    }

    const policy = await prisma.healthPolicy.update({
      where: { id: params.id },
      data: {
        ...(policyNumber && { policyNumber }),
        ...(holderName && { holderName }),
        ...(holderEmail && { holderEmail }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(premium && { premium: parseInt(premium) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Policy update error:", error);
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

    // Check if policy exists and belongs to tenant
    const existingPolicy = await prisma.healthPolicy.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingPolicy) {
      return NextResponse.json({ error: "Poliçe bulunamadı" }, { status: 404 });
    }

    await prisma.healthPolicy.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Poliçe silindi" });
  } catch (error) {
    console.error("Policy delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

