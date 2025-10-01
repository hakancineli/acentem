"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TransferBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  passengerCount: number;
  passengers: string[];
  totalAmount: number;
  currency: string;
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
  const [booking, setBooking] = useState<TransferBooking | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pickupLocation: "",
    dropoffLocation: "",
    pickupDate: "",
    passengerCount: 1,
    passengers: [""],
    totalAmount: "",
    currency: "TRY",
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
      fetch(`/api/transfer/rezervasyonlar/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.booking) {
            setBooking(data.booking);
            setFormData({
              customerName: data.booking.customerName || "",
              customerPhone: data.booking.customerPhone || "",
              customerEmail: data.booking.customerEmail || "",
              pickupLocation: data.booking.pickupLocation || "",
              dropoffLocation: data.booking.dropoffLocation || "",
              pickupDate: data.booking.pickupDate ? new Date(data.booking.pickupDate).toISOString().slice(0, 16) : "",
              passengerCount: data.booking.passengerCount || 1,
              passengers: data.booking.passengers || [""],
              totalAmount: data.booking.totalAmount?.toString() || "",
              currency: data.booking.currency || "TRY",
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
      const response = await fetch(`/api/transfer/rezervasyonlar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/transfer/rezervasyonlar");
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

  const handlePassengerCountChange = (count: number) => {
    setFormData(prev => ({
      ...prev,
      passengerCount: count,
      passengers: Array(count).fill("").map((_, index) => prev.passengers[index] || "")
    }));
  };

  const handlePassengerNameChange = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      passengers: prev.passengers.map((passenger, i) => i === index ? name : passenger)
    }));
  };

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Transfer Rezervasyonu Düzenle</h1>
          <p className="text-slate-600 dark:text-slate-400">Rezervasyon bilgilerini güncelleyin</p>
        </div>
      </div>

      {/* Form */}
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

          {/* Transfer Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Transfer Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Alış Yeri *
                </label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  required
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Bırakış Yeri *
                </label>
                <input
                  type="text"
                  name="dropoffLocation"
                  value={formData.dropoffLocation}
                  onChange={handleChange}
                  required
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Transfer Tarihi *
                </label>
                <input
                  type="datetime-local"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleChange}
                  required
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Yolcu Sayısı *
                </label>
                <select
                  name="passengerCount"
                  value={formData.passengerCount}
                  onChange={(e) => handlePassengerCountChange(parseInt(e.target.value))}
                  required
                  className="modern-input"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} kişi</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Yolcu İsimleri */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Yolcu İsimleri
              </label>
              <div className="space-y-2">
                {Array.from({ length: formData.passengerCount }, (_, index) => (
                  <input
                    key={index}
                    type="text"
                    value={formData.passengers[index] || ""}
                    onChange={(e) => handlePassengerNameChange(index, e.target.value)}
                    placeholder={`Yolcu ${index + 1} adı`}
                    className="modern-input"
                  />
                ))}
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
                  onChange={handleChange}
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

          {/* Fiyat Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Fiyat Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Toplam Tutar *
                </label>
                <input
                  type="number"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Para Birimi
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="modern-input"
                >
                  <option value="TRY">₺ TRY</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>
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
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notlar */}
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
              placeholder="Ek notlar..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={loading}
              className="modern-button-primary"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <Link href="/transfer/rezervasyonlar" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
