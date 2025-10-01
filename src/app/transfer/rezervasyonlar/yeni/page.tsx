"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Transfer {
  id: string;
  name: string;
  vehicleType: string;
  capacity: number;
  price: number;
  from: string;
  to: string;
}

export default function YeniRezervasyonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [formData, setFormData] = useState({
    transferId: "",
    customerName: "",
    customerPhone: "",
    pickupLocation: "",
    dropoffLocation: "",
    pickupDate: "",
    distance: "",
    totalAmount: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    // Fetch transfers
    fetch("/api/transfer/araclar")
      .then(res => res.json())
      .then(data => {
        if (data.transfers) {
          setTransfers(data.transfers);
        }
      })
      .catch(error => console.error("Error fetching transfers:", error));
  }, []);

  useEffect(() => {
    // Update selected transfer when transferId changes
    if (formData.transferId) {
      const transfer = transfers.find(t => t.id === formData.transferId);
      setSelectedTransfer(transfer || null);
    }
  }, [formData.transferId, transfers]);

  useEffect(() => {
    // Calculate total price when transfer and distance are selected
    if (selectedTransfer && formData.distance) {
      const totalAmount = selectedTransfer.price * parseFloat(formData.distance);
      setFormData(prev => ({ ...prev, totalAmount: totalAmount.toString() }));
    }
  }, [selectedTransfer, formData.distance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/transfer/rezervasyonlar", {
        method: "POST",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Yeni Transfer Rezervasyonu</h1>
          <p className="text-slate-600 dark:text-slate-400">Yeni bir transfer rezervasyonu oluşturun</p>
        </div>
        <Link href="/transfer/rezervasyonlar" className="modern-button-secondary">
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
            <div>
              <label htmlFor="transferId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Araç *
              </label>
              <select
                id="transferId"
                name="transferId"
                value={formData.transferId}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="">Araç seçin...</option>
                {transfers.map((transfer) => (
                  <option key={transfer.id} value={transfer.id}>
                    {transfer.name} - {transfer.vehicleType} ({transfer.capacity} kişi) - ₺{transfer.price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Müşteri Adı *
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>

            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Müşteri Telefonu *
              </label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: +90 555 123 45 67"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Durum
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="modern-input w-full"
              >
                <option value="pending">Beklemede</option>
                <option value="confirmed">Onaylandı</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
            </div>

            <div>
              <label htmlFor="pickupLocation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nereden *
              </label>
              <input
                type="text"
                id="pickupLocation"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Antalya Havalimanı"
              />
            </div>

            <div>
              <label htmlFor="dropoffLocation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nereye *
              </label>
              <input
                type="text"
                id="dropoffLocation"
                name="dropoffLocation"
                value={formData.dropoffLocation}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Lara Beach Hotel"
              />
            </div>

            <div>
              <label htmlFor="pickupDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Pickup Tarihi *
              </label>
              <input
                type="datetime-local"
                id="pickupDate"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleChange}
                required
                className="modern-input w-full"
              />
            </div>

            <div>
              <label htmlFor="distance" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mesafe (KM)
              </label>
              <input
                type="number"
                id="distance"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="modern-input w-full"
                placeholder="Örn: 25.5"
              />
              {selectedTransfer && formData.distance && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {formData.distance} km × ₺{selectedTransfer.pricePerKm} = ₺{formData.totalAmount}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Toplam Fiyat (₺) *
              </label>
              <input
                type="number"
                id="totalAmount"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="modern-input w-full"
                placeholder="Otomatik hesaplanır"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notlar
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="modern-input w-full"
              placeholder="Özel istekler, notlar..."
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
                  Rezervasyonu Kaydet
                </>
              )}
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

