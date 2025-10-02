import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getCurrencyRates, convertCurrency } from "@/lib/currencyService";

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
    const hotelId = searchParams.get("hotel") || "";

    // Build where clause
    const where = {
      tenantId,
      ...(hotelId && { hotelId }),
      ...(status && { status }),
      ...(q && {
        OR: [
          { customers: { string_contains: q } },
          { hotel: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }),
    };

    // Get reservations with pagination
    const [reservations, totalCount] = await Promise.all([
      prisma.hotelReservation.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          hotel: true,
        },
      }),
      prisma.hotelReservation.count({ where }),
    ]);

    return NextResponse.json({
      reservations,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Rezervasyonlar API error:", error);
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
      hotelId,
      customers,
      checkIn,
      checkOut,
      rooms,
      adults,
      children,
      totalAmount,
      currency = "TRY",
      paymentMethod,
      collectionMethod,
      paymentTiming,
      depositAmount,
      status = "pending",
      notes
    } = body;

    if (!hotelId || !customers || !Array.isArray(customers) || customers.length === 0 || !checkIn || !checkOut || !rooms || !adults || !totalAmount) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    // Validate customers
    for (const customer of customers) {
      if (!customer.name || !customer.phone) {
        return NextResponse.json({ error: "Her müşteri için ad ve telefon gereklidir" }, { status: 400 });
      }
    }

    // Check if hotel exists and belongs to tenant
    const hotel = await prisma.hotel.findFirst({
      where: {
        id: hotelId,
        tenantId,
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Otel bulunamadı" }, { status: 404 });
    }

    // Kapora hesaplama
    // Get exchange rates for currency conversion
    const rates = await getCurrencyRates();
    const exchangeRate = currency !== "TRY" ? rates[currency as keyof typeof rates]?.selling : 1;
    
    const calculatedDepositAmount = paymentTiming === "kapora" && depositAmount ? parseFloat(depositAmount) : parseFloat(totalAmount);
    const calculatedRemainingAmount = paymentTiming === "kapora" && depositAmount ? parseFloat(totalAmount) - parseFloat(depositAmount) : 0;

    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));

    const reservation = await prisma.hotelReservation.create({
      data: {
        tenantId,
        hotelId,
        customers: JSON.stringify(customers),
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        nights,
        rooms: parseInt(rooms),
        adults: parseInt(adults),
        children: parseInt(children) || 0,
        totalAmount: parseFloat(totalAmount),
        currency,
        exchangeRate,
        paymentMethod,
        collectionMethod,
        paymentTiming,
        depositAmount: calculatedDepositAmount,
        remainingAmount: calculatedRemainingAmount,
        status,
        notes,
      },
    });

    // Muhasebe kaydı: pending income / otel kategorisi
    // Calculate amount in TRY for accounting
    const amountTRY = currency === "TRY" ? calculatedDepositAmount : calculatedDepositAmount * (exchangeRate || 1);
    const primaryCustomer = customers[0];

    const transaction = await prisma.transaction.create({
      data: {
        tenantId,
        type: "income",
        category: "otel",
        amount: calculatedDepositAmount,
        currency,
        exchangeRate,
        amountTRY,
        description: `Otel rezervasyon ücreti (${primaryCustomer.name}${customers.length > 1 ? ` +${customers.length - 1} kişi` : ''})`,
        source: primaryCustomer.name || "Müşteri",
        reference: reservation.id,
        date: new Date(),
        status: "pending",
        notes: `Otel: ${hotel.name}, ${rooms} oda, ${adults} yetişkin, ${children || 0} çocuk, ${nights} gece. Ödeme: ${paymentMethod || 'Belirtilmedi'}, Tahsilat: ${collectionMethod || 'Belirtilmedi'}. Para birimi: ${currency}`,
      },
    });

    return NextResponse.json({ reservation, transaction }, { status: 201 });
  } catch (error) {
    console.error("Reservation create error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

