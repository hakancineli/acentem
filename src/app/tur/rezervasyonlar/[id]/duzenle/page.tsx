"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TourBooking {
  id: string;
  tourId: string;
  tour: {
    id: string;
    name: string;
  };
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  startDate: string;
  participants: number;
  totalAmount: number;
  driverId?: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    commission: number;
  };
  driverCommission?: number;
  driverPaid: boolean;
  paymentMethod?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DuzenleRezervasyonPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<TourBooking | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    startDate: "",
    participants: 1,
    totalAmount: "",
    driverId: "",
    driverCommission: "",
    driverPaid: false,
    paymentMethod: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const { id } = await params;
      
      // Fetch booking data
      fetch(`/api/tur/rezervasyonlar/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.booking) {
            setBooking(data.booking);
            setFormData({
              customerName: data.booking.customerName || "",
              customerPhone: data.booking.customerPhone || "",
              customerEmail: data.booking.customerEmail || "",
              startDate: data.booking.startDate ? new Date(data.booking.startDate).toISOString().slice(0, 16) : "",
              participants: data.booking.participants || 1,
              totalAmount: data.booking.totalAmount?.toString() || "",
              driverId: data.booking.driverId || "",
              driverCommission: data.booking.driverCommission?.toString() || "",
              driverPaid: data.booking.driverPaid || false,
              paymentMethod: data.booking.paymentMethod || "",
              status: data.booking.status || "pending",
              notes: data.booking.notes || "",
            });
          }
        })
        .catch(error => console.error("Error fetching booking:", error));

      // Fetch drivers
      fetch("/api/soforler")
        .then(res => res.json())
        .then(data => {
          if (data) {
            setDrivers(data);
          }
        })
        .catch(error => console.error("Error fetching drivers:", error));
    };

    fetchData();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { id } = await params;
      const response = await fetch(`/api/tur/rezervasyonlar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/tur/rezervasyonlar");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const driverId = e.target.value;
    const selectedDriver = drivers.find(d => d.id === driverId);
    
    setFormData(prev => ({
      ...prev,
      driverId,
      driverCommission: selectedDriver ? Math.round((parseInt(prev.totalAmount) * selectedDriver.commission) / 100).toString() : "",
    }));
  };

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Tur Rezervasyonu Düzenle</h1>
        </div>
        <div className="modern-card p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Tur Rezervasyonu Düzenle</h1>
        <Link href="/tur/rezervasyonlar" className="modern-button-secondary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Geri Dön
        </Link>
      </div>

      <div className="modern-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Müşteri Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Müşteri Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Müşteri Adı *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Telefon *
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className="modern-input"
                />
              </div>
            </div>
          </div>

          {/* Tur Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Tur Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tur
                </label>
                <input
                  type="text"
                  value={booking.tour.name}
                  disabled
                  className="modern-input bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Başlangıç Tarihi *
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Katılımcı Sayısı *
                </label>
                <input
                  type="number"
                  name="participants"
                  value={formData.participants}
                  onChange={handleChange}
                  min="1"
                  required
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Toplam Tutar (₺) *
                </label>
                <input
                  type="number"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="modern-input"
                />
              </div>
            </div>
          </div>

          {/* Şoför Ataması */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Şoför Ataması</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Şoför Seç
                </label>
                <select
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleDriverChange}
                  className="modern-input"
                >
                  <option value="">Şoför seçin</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - %{driver.commission} komisyon
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Şoför Komisyonu (₺)
                </label>
                <input
                  type="number"
                  name="driverCommission"
                  value={formData.driverCommission}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="modern-input"
                  placeholder="Otomatik hesaplanır"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ödeme Yöntemi
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="modern-input"
                >
                  <option value="">Seçin</option>
                  <option value="cash">Nakit</option>
                  <option value="card">Kart</option>
                  <option value="transfer">Havale</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="driverPaid"
                  checked={formData.driverPaid}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverPaid: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Şoföre ödeme yapıldı
                </label>
              </div>
            </div>
          </div>

          {/* Durum ve Notlar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Durum ve Notlar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Durum
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="modern-input"
                >
                  <option value="pending">Beklemede</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notlar
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="modern-input"
                placeholder="Rezervasyon hakkında notlar..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              className="modern-button-primary"
              disabled={loading}
            >
              {loading ? "Kaydediliyor..." : "Rezervasyonu Güncelle"}
            </button>
            <Link href="/tur/rezervasyonlar" className="modern-button-secondary">İptal</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
