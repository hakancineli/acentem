import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const params = await context.params;
    const transactionId = params.id;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId,
        type: "income",
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Transaction get error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const params = await context.params;
    const transactionId = params.id;

    const body = await request.json();
    const { 
      type, 
      category, 
      amount, 
      description, 
      source, 
      reference, 
      date, 
      status, 
      notes 
    } = body;

    if (!type || !category || !amount || !description || !source || !date) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    // Transaction'ın bu tenant'a ait olduğunu kontrol et
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId,
        type: "income",
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction bulunamadı" }, { status: 404 });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        type,
        category,
        amount: parseInt(amount),
        description,
        source,
        reference,
        date: new Date(date),
        status,
        notes,
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Transaction update error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
    }

    const params = await context.params;
    const transactionId = params.id;

    // Transaction'ın bu tenant'a ait olduğunu kontrol et
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId,
        type: "income",
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction bulunamadı" }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Transaction delete error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
