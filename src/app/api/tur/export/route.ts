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
    const type = searchParams.get("type") || "tours";
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const dir = searchParams.get("dir") || "desc";

    if (type === "tours") {
      // Export tours
      const where = {
        tenantId,
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { destination: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }),
      };

      const tours = await prisma.tour.findMany({
        where,
        orderBy: { [sort]: dir },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      });

      // Convert to CSV
      const csvHeader = "ID,Ad,Destinasyon,Süre,Fiyat,Açıklama,Aktif,Rezervasyon Sayısı,Oluşturulma\n";
      const csvRows = tours.map(tour => 
        `${tour.id},"${tour.name}","${tour.destination}",${tour.duration},${tour.price},"${tour.description || ''}",${tour.isActive ? 'Evet' : 'Hayır'},${tour._count.bookings},"${tour.createdAt.toISOString()}"`
      ).join('\n');

      const csv = csvHeader + csvRows;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="turlar-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (type === "bookings") {
      // Export bookings
      const where = {
        tenantId,
        ...(q && {
          OR: [
            { customerName: { contains: q, mode: "insensitive" as const } },
            { customerEmail: { contains: q, mode: "insensitive" as const } },
            { tour: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }),
      };

      const bookings = await prisma.tourBooking.findMany({
        where,
        orderBy: { [sort]: dir },
        include: {
          tour: true,
        },
      });

      // Convert to CSV
      const csvHeader = "ID,Müşteri Adı,Email,Tur,Başlangıç Tarihi,Katılımcı Sayısı,Toplam Fiyat,Durum,Notlar,Oluşturulma\n";
      const csvRows = bookings.map(booking => 
        `${booking.id},"${booking.customerName}","${booking.customerEmail}","${booking.tour.name}","${booking.startDate.toISOString().split('T')[0]}",${booking.participants},${booking.totalAmount},"${booking.status}","${booking.notes || ''}","${booking.createdAt.toISOString()}"`
      ).join('\n');

      const csv = csvHeader + csvRows;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tur-rezervasyonlari-${new Date().toISOString().split('T')[0]}.csv"`,
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

