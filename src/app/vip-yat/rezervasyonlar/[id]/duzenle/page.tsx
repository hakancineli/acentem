"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface YachtBooking {
  id: string;
  yachtId: string;
  yacht: { name: string, length: number, capacity: number };
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  startDate: string;
  endDate: string;
  days: number;
  pricePerDay: number;
  totalPrice: number;
  currency: string;
  exchangeRate?: number | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditYachtBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<YachtBooking | null>(null);
  const [formData, setFormData] = useState<Partial<YachtBooking>>({});

  useEffect(() => {
    async function fetchBooking() {
      try {
        const { id } = await params;
        const res = await fetch(`/api/vip-yat/rezervasyonlar/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data.booking);
          setFormData({
            ...data.booking,
            startDate: new Date(data.booking.startDate).toISOString().split('T')[0],
            endDate: new Date(data.booking.endDate).toISOString().split('T')[0],
          });
        } else {
          console.error("Failed to fetch booking");
          alert("Rezervasyon bulunamadı veya yetkiniz yok.");
          router.push("/vip-yat/rezervasyonlar");
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        alert("Rezervasyon bilgileri alınırken bir hata oluştu.");
        router.push("/vip-yat/rezervasyonlar");
      }
    }

    fetchBooking();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { id } = await params;
      const response = await fetch(`/api/vip-yat/rezervasyonlar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Rezervasyon başarıyla güncellendi!");
        router.push("/vip-yat/rezervasyonlar");
      } else {
        const error = await response.json();
        alert(error.error || "Bir hata oluştu");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCurrencySymbol = (currency: string) => string(currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺");

  if (!booking) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">VIP Yat Rezervasyonu Düzenle</h1>
          <p className="text-slate-600 dark:text-slate-400">Rezervasyon detaylarını güncelleyin</p>
        </div>
        <Link href="/vip-yat/rezervasyonlar" className="modern-button-secondary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Geri Dön
        </Link>
      </div>

      {/* Form */}
      <div className="modern-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Yacht Info */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Yat
              </label>
              <input
                type="text"
                value={booking.yacht.name}
                disabled
                className="modern-input w-full bg-slate-100 dark:bg-slate-700"
              />
              <p className="text-sm text-slate-500 mt-1">
                {booking.yacht.length}m • {booking.yacht.capacity} kişi
              </p>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Durum
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
                className="modern-input w-full"
              >
                <option value="pending">Beklemede</option>
                <option value="confirmed">Onaylandı</option>
                <option value="cancelled">İptal Edildi</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>

            {/* Dates */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate || ""}
                onChange={handleChange}
                className="modern-input w-full"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate || ""}
                onChange={handleChange}
                className="modern-input w-full"
              />
            </div>

            {/* Customer Info */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Müşteri Adı
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName || ""}
                onChange={handleChange}
                required
                className="modern-input w-full"
              />
            </div>
            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone || ""}
                onChange={handleChange}
                required
                className="modern-input w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="customerEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail || ""}
                onChange={handleChange}
                className="modern-input w-full"
              />
            </div>

            {/* Pricing */}
            <div className="md:col-span-2">
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Para Birimi
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency || "TRY"}
                onChange={handleChange}
                className="modern-input w-full md:w-1/3"
              >
                <option value="TRY">🇹🇷 Türk Lirası (₺)</option>
                <option value="EUR">🇪🇺 Euro (€)</option>
                <option value="USD">🇺🇸 Amerikan Doları ($)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notlar
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              rows={3}
              className="modern-input w-full"
            />
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="modern-button"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
            <Link href="/vip-yat/rezervasyonlar" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
