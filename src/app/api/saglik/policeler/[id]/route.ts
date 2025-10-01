import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const { id } = await params;

    const policy = await prisma.healthPolicy.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        insurance: true,
      },
    });

    if (!policy) {
      return NextResponse.json({ error: "Poliçe bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ policy });
  } catch (error) {
    console.error("Policy get error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const body = await request.json();
    const { 
      customerName, 
      customerPhone,
      customerEmail, 
      startDate, 
      endDate, 
      totalAmount, 
      status, 
      notes 
    } = body;

    const { id } = await params;

    // Check if policy exists and belongs to tenant
    const existingPolicy = await prisma.healthPolicy.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        insurance: true,
      },
    });

    if (!existingPolicy) {
      return NextResponse.json({ error: "Poliçe bulunamadı" }, { status: 404 });
    }

    const policy = await prisma.healthPolicy.update({
      where: { id },
      data: {
        ...(customerName && { customerName }),
        ...(customerPhone && { customerPhone }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(totalAmount && { totalAmount: parseInt(totalAmount) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    let voucher: any = null;

    // Aktif olduğunda: sağlık gelir fişi (voucher) oluştur
    if (status === "active") {
      // Muhasebe kaydı: income / saglik kategorisi
      // Mevcut fiş varsa güncelle, yoksa oluştur
      const existingTx = await prisma.transaction.findFirst({ 
        where: { tenantId, reference: policy.id } 
      });
      
      if (existingTx) {
        voucher = await prisma.transaction.update({
          where: { id: existingTx.id },
          data: {
            amount: policy.totalAmount,
            description: `Sağlık sigortası primi (${policy.customerName})`,
            date: new Date(),
            status: "completed",
            notes: `Sigorta: ${existingPolicy.insurance.provider} ${existingPolicy.insurance.planName}, ${policy.startDate.toLocaleDateString("tr-TR")} - ${policy.endDate.toLocaleDateString("tr-TR")}`,
          },
        });
      } else {
        voucher = await prisma.transaction.create({
          data: {
            tenantId,
            type: "income",
            category: "saglik",
            amount: policy.totalAmount,
            description: `Sağlık sigortası primi (${policy.customerName})`,
            source: policy.customerName || "Müşteri",
            reference: policy.id,
            date: new Date(),
            status: "completed",
            notes: `Sigorta: ${existingPolicy.insurance.provider} ${existingPolicy.insurance.planName}, ${policy.startDate.toLocaleDateString("tr-TR")} - ${policy.endDate.toLocaleDateString("tr-TR")}`,
          },
        });
      }
    }

    return NextResponse.json({ policy, voucher });
  } catch (error) {
    console.error("Policy update error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const { id } = await params;

    // Check if policy exists and belongs to tenant
    const existingPolicy = await prisma.healthPolicy.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingPolicy) {
      return NextResponse.json({ error: "Poliçe bulunamadı" }, { status: 404 });
    }

    await prisma.healthPolicy.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Poliçe silindi" });
  } catch (error) {
    console.error("Policy delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

