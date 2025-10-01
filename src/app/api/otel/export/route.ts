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
    const type = searchParams.get("type") || "hotels";
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const dir = searchParams.get("dir") || "desc";

    if (type === "hotels") {
      // Export hotels
      const where = {
        tenantId,
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { location: { contains: q, mode: "insensitive" as const } },
          ],
        }),
      };

      const hotels = await prisma.hotel.findMany({
        where,
        orderBy: { [sort]: dir },
        include: {
          _count: {
            select: { reservations: true },
          },
        },
      });

      // Convert to CSV
      const csvHeader = "ID,Ad,Konum,Yıldız,Olanaklar,Aktif,Rezervasyon Sayısı,Oluşturulma\n";
      const csvRows = hotels.map(hotel => 
        `${hotel.id},"${hotel.name}","${hotel.location}",${hotel.starRating},"${hotel.amenities || ''}",${hotel.isActive ? 'Evet' : 'Hayır'},${hotel._count.reservations},"${hotel.createdAt.toISOString()}"`
      ).join('\n');

      const csv = csvHeader + csvRows;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="oteller-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (type === "reservations") {
      // Export reservations
      const where = {
        tenantId,
        ...(q && {
          OR: [
            { guestName: { contains: q, mode: "insensitive" as const } },
            { guestEmail: { contains: q, mode: "insensitive" as const } },
            { hotel: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }),
      };

      const reservations = await prisma.hotelReservation.findMany({
        where,
        orderBy: { [sort]: dir },
        include: {
          hotel: true,
        },
      });

      // Convert to CSV
      const csvHeader = "ID,Misafir Adı,Email,Otel,Giriş Tarihi,Çıkış Tarihi,Oda Sayısı,Yetişkin,Çocuk,Toplam Fiyat,Durum,Notlar,Oluşturulma\n";
      const csvRows = reservations.map(reservation => 
        `${reservation.id},"${reservation.guestName}","${reservation.guestEmail}","${reservation.hotel.name}","${reservation.checkIn.toISOString().split('T')[0]}","${reservation.checkOut.toISOString().split('T')[0]}",${reservation.rooms},${reservation.adults},${reservation.children},${reservation.totalAmount},"${reservation.status}","${reservation.notes || ''}","${reservation.createdAt.toISOString()}"`
      ).join('\n');

      const csv = csvHeader + csvRows;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="otel-rezervasyonlari-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      return NextResponse.json({ error: "Geçersiz export tipi" }, { status: 400 });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

