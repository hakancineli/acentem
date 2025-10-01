"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Tour {
  id: string;
  name: string;
  destination: string;
  duration: number;
  price: number;
}

export default function YeniRezervasyonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [formData, setFormData] = useState({
    tourId: "",
    customerName: "",
    customerEmail: "",
    startDate: "",
    participants: "",
    totalAmount: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    // Fetch tours
    fetch("/api/tur/turlar")
      .then(res => res.json())
      .then(data => {
        if (data.tours) {
          setTours(data.tours);
        }
      })
      .catch(error => console.error("Error fetching tours:", error));
  }, []);

  useEffect(() => {
    // Update total price when tour is selected
    if (selectedTour && formData.participants) {
      const totalAmount = selectedTour.price * parseInt(formData.participants);
      setFormData(prev => ({ ...prev, totalAmount: totalAmount.toString() }));
    }
  }, [selectedTour, formData.participants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/tur/rezervasyonlar", {
        method: "POST",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update selected tour when tourId changes
    if (name === "tourId") {
      const tour = tours.find(t => t.id === value);
      setSelectedTour(tour || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Yeni Tur Rezervasyonu</h1>
          <p className="text-slate-600 dark:text-slate-400">Yeni bir tur rezervasyonu oluşturun</p>
        </div>
        <Link href="/tur/rezervasyonlar" className="modern-button-secondary">
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
              <label htmlFor="tourId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tur Paketi *
              </label>
              <select
                id="tourId"
                name="tourId"
                value={formData.tourId}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="">Tur seçin...</option>
                {tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.name} - {tour.destination} ({tour.duration} gün, ₺{tour.price.toLocaleString()})
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
              <label htmlFor="customerEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Müşteri Email *
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: ahmet@example.com"
              />
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Başlangıç Tarihi *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="modern-input w-full"
              />
            </div>

            <div>
              <label htmlFor="participants" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Katılımcı Sayısı *
              </label>
              <input
                type="number"
                id="participants"
                name="participants"
                value={formData.participants}
                onChange={handleChange}
                required
                min="1"
                className="modern-input w-full"
                placeholder="Örn: 2"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="modern-input w-full"
                placeholder="Otomatik hesaplanır"
              />
              {selectedTour && formData.participants && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {formData.participants} kişi × ₺{selectedTour.price.toLocaleString()} = ₺{formData.totalAmount}
                </p>
              )}
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
            <Link href="/tur/rezervasyonlar" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

