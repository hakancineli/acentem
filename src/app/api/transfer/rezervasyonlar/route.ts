import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let tenantId = cookieStore.get("tenant-id")?.value;

    // Eğer cookie'de tenant yoksa, ilk tenant ile devam et (formların çalışması için güvenli varsayılan)
    if (!tenantId) {
      const firstTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
      if (firstTenant?.id) {
        tenantId = firstTenant.id;
      } else {
        return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
      }
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const dir = searchParams.get("dir") || "desc";
    const status = searchParams.get("status") || "";

    // Build where clause
    const where = {
      tenantId,
      ...(status && { status }),
      ...(q && {
        OR: [
          { customerName: { contains: q, mode: "insensitive" as const } },
          { customerPhone: { contains: q, mode: "insensitive" as const } },
          { pickupLocation: { contains: q, mode: "insensitive" as const } },
          { dropoffLocation: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    // Get bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      prisma.transferBooking.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transferBooking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
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
      customerPhone, 
      pickupLocation, 
      dropoffLocation, 
      pickupDate, 
      passengerCount,
      passengers,
      currency,
      totalAmount, 
      notes 
    } = body;

    if (!customerPhone || !pickupLocation || !dropoffLocation || !pickupDate || !passengerCount || !passengers || !totalAmount || !currency) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
    }

    // Transfer ataması sonradan yapılacak

    const booking = await prisma.transferBooking.create({
      data: {
        tenantId,
        customerName: passengers.join(", "), // Yolcu isimlerini birleştir
        customerPhone,
        pickupLocation,
        dropoffLocation,
        pickupDate: new Date(pickupDate),
        pickupTime: new Date(pickupDate).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }),
        passengers: passengerCount,
        totalAmount: parseInt(totalAmount),
        status: "waiting_for_driver", // Şoför ataması bekleniyor
        notes: `${notes}\nPara Birimi: ${currency}\nYolcu Sayısı: ${passengerCount}`,
      },
    });

    // Pending transaction oluştur
    await prisma.transaction.create({
      data: {
        tenantId,
        type: "income",
        category: "transfer",
        amount: parseInt(totalAmount),
        description: `Transfer ücreti (${passengers.join(", ")})`,
        source: passengers.join(", ") || "Müşteri",
        reference: booking.id,
        date: new Date(pickupDate),
        status: "pending", // Henüz ödenmemiş
        notes: `Transfer: ${pickupLocation} → ${dropoffLocation}`,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Booking create error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Sunucu hatası", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

