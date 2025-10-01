import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";

interface TransferBookingDetailPageProps {
  params: { id: string };
}

export default async function TransferBookingDetailPage({ params }: TransferBookingDetailPageProps) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;

  if (!tenantId) {
    notFound();
  }

  const { id } = await params;

  const booking = await prisma.transferBooking.findFirst({
    where: {
      id,
      tenantId,
    },
  });

  if (!booking) {
    notFound();
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "confirmed":
        return "Onaylandı";
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Transfer Rezervasyonu Detayı</h1>
          <p className="text-slate-600 dark:text-slate-400">Rezervasyon bilgilerini görüntüleyin</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link 
          href={`/transfer/rezervasyonlar/${id}/duzenle`}
          className="modern-button-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Düzenle
        </Link>
        <Link 
          href="/transfer/rezervasyonlar"
          className="modern-button-secondary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Geri Dön
        </Link>
      </div>

      {/* Booking Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Müşteri Bilgileri */}
        <div className="modern-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Müşteri Bilgileri</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ad Soyad:</span>
              <p className="text-slate-800 dark:text-slate-200">{booking.customerName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Telefon:</span>
              <p className="text-slate-800 dark:text-slate-200">{booking.customerPhone}</p>
            </div>
            {booking.customerEmail && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">E-posta:</span>
                <p className="text-slate-800 dark:text-slate-200">{booking.customerEmail}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transfer Bilgileri */}
        <div className="modern-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Transfer Bilgileri</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Alış Yeri:</span>
              <p className="text-slate-800 dark:text-slate-200">{booking.pickupLocation}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Bırakış Yeri:</span>
              <p className="text-slate-800 dark:text-slate-200">{booking.dropoffLocation}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Transfer Tarihi:</span>
              <p className="text-slate-800 dark:text-slate-200">
                {new Date(booking.pickupDate).toLocaleString("tr-TR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Yolcu Sayısı:</span>
              <p className="text-slate-800 dark:text-slate-200">{booking.passengerCount} kişi</p>
            </div>
          </div>
        </div>

        {/* Yolcu Listesi */}
        {booking.passengers && booking.passengers.length > 0 && (
          <div className="modern-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Yolcu Listesi</h3>
            <div className="space-y-2">
              {booking.passengers.map((passenger, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-slate-800 dark:text-slate-200">
                    {passenger || `Yolcu ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fiyat ve Durum */}
        <div className="modern-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Fiyat ve Durum</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Toplam Tutar:</span>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {booking.currency === "TRY" ? "₺" : booking.currency === "USD" ? "$" : "€"}
                {booking.totalAmount.toLocaleString("tr-TR")}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Durum:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Oluşturulma:</span>
              <p className="text-slate-800 dark:text-slate-200">
                {new Date(booking.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Son Güncelleme:</span>
              <p className="text-slate-800 dark:text-slate-200">
                {new Date(booking.updatedAt).toLocaleString("tr-TR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notlar */}
      {booking.notes && (
        <div className="modern-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Notlar</h3>
          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{booking.notes}</p>
        </div>
      )}
    </div>
  );
}
