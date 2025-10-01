import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jsPDF } from "jspdf";

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

    const { id } = await context.params;
    const rental = await prisma.vehicleRental.findFirst({
      where: { id, tenantId },
      include: { vehicle: true },
    });
    if (!rental) {
      return NextResponse.json({ error: "Kiralama bulunamadı" }, { status: 404 });
    }

    // PDF oluştur
    const doc = new jsPDF();
    
    // Başlık
    doc.setFontSize(20);
    doc.text("ARAÇ KİRALAMA VOUCHER", 20, 30);
    
    // Çizgi
    doc.line(20, 35, 190, 35);
    
    // Bilgiler
    doc.setFontSize(12);
    let y = 50;
    
    doc.text(`Müşteri Adı: ${rental.customerName}`, 20, y);
    y += 10;
    
    doc.text(`Telefon: ${rental.customerPhone}`, 20, y);
    y += 10;
    
    if (rental.customerEmail) {
      doc.text(`E-posta: ${rental.customerEmail}`, 20, y);
      y += 10;
    }
    
    doc.text(`Araç: ${rental.vehicle.brand} ${rental.vehicle.model}`, 20, y);
    y += 10;
    
    doc.text(`Plaka: ${rental.vehicle.plate}`, 20, y);
    y += 10;
    
    doc.text(`Başlangıç: ${new Date(rental.startDate).toLocaleDateString("tr-TR")}`, 20, y);
    y += 10;
    
    doc.text(`Bitiş: ${new Date(rental.endDate).toLocaleDateString("tr-TR")}`, 20, y);
    y += 10;
    
    doc.text(`Süre: ${rental.days} gün`, 20, y);
    y += 10;
    
    doc.text(`Günlük Ücret: ₺${rental.dailyRate.toLocaleString("tr-TR")}`, 20, y);
    y += 10;
    
    if (rental.deposit) {
      doc.text(`Depozito: ₺${rental.deposit.toLocaleString("tr-TR")}`, 20, y);
      y += 10;
    }
    
    // Toplam tutar kalın
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`TOPLAM: ₺${rental.totalAmount.toLocaleString("tr-TR")}`, 20, y + 10);
    
    // Teslim/İade bilgileri
    if (rental.pickupLocation || rental.returnLocation) {
      y += 30;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      
      if (rental.pickupLocation) {
        doc.text(`Teslim Yeri: ${rental.pickupLocation}`, 20, y);
        y += 10;
      }
      
      if (rental.returnLocation) {
        doc.text(`İade Yeri: ${rental.returnLocation}`, 20, y);
        y += 10;
      }
    }
    
    // Notlar
    if (rental.notes) {
      y += 10;
      doc.text(`Notlar: ${rental.notes}`, 20, y);
    }
    
    // Alt bilgi
    doc.setFontSize(10);
    doc.text(`Voucher ID: ${rental.id}`, 20, 280);
    doc.text(`Oluşturulma: ${new Date().toLocaleDateString("tr-TR")}`, 20, 290);

    // PDF'i buffer'a çevir
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="voucher-${rental.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Voucher error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}


