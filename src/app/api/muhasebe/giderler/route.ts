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
    const category = searchParams.get("category") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Build where clause for expenses
    const where = {
      tenantId,
      type: "expense" as const,
      ...(category && { category }),
      ...(q && {
        OR: [
          { description: { contains: q, mode: "insensitive" as const } },
          { source: { contains: q, mode: "insensitive" as const } },
          { reference: { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(dateFrom && dateTo && {
        date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      }),
    };

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Expenses API error:", error);
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
      category, 
      amount, 
      description, 
      source, 
      reference, 
      date, 
      status = "pending",
      notes 
    } = body;

    if (!category || !amount || !description || !source || !date) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        tenantId,
        type: "expense",
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

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Expense create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

