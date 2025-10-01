"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function YeniUcusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    airline: "",
    flightNumber: "",
    departure: "",
    arrival: "",
    departureTime: "",
    arrivalTime: "",
    price: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/ucak/ucuslar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/ucak/ucuslar");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Yeni Uçuş</h1>
          <p className="text-slate-600 dark:text-slate-400">Yeni bir uçuş ekleyin</p>
        </div>
        <Link href="/ucak/ucuslar" className="modern-button-secondary">
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
              <label htmlFor="airline" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Havayolu *
              </label>
              <select
                id="airline"
                name="airline"
                value={formData.airline}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="">Havayolu seçin...</option>
                <option value="Turkish Airlines">Turkish Airlines</option>
                <option value="Pegasus">Pegasus</option>
                <option value="SunExpress">SunExpress</option>
                <option value="AnadoluJet">AnadoluJet</option>
                <option value="AtlasGlobal">AtlasGlobal</option>
                <option value="Corendon Airlines">Corendon Airlines</option>
                <option value="Freebird Airlines">Freebird Airlines</option>
                <option value="Onur Air">Onur Air</option>
              </select>
            </div>

            <div>
              <label htmlFor="flightNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Uçuş Numarası *
              </label>
              <input
                type="text"
                id="flightNumber"
                name="flightNumber"
                value={formData.flightNumber}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: TK1234"
              />
            </div>

            <div>
              <label htmlFor="departure" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kalkış Havalimanı *
              </label>
              <input
                type="text"
                id="departure"
                name="departure"
                value={formData.departure}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: İstanbul (IST)"
              />
            </div>

            <div>
              <label htmlFor="arrival" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Varış Havalimanı *
              </label>
              <input
                type="text"
                id="arrival"
                name="arrival"
                value={formData.arrival}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Antalya (AYT)"
              />
            </div>

            <div>
              <label htmlFor="departureTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kalkış Saati *
              </label>
              <input
                type="datetime-local"
                id="departureTime"
                name="departureTime"
                value={formData.departureTime}
                onChange={handleChange}
                required
                className="modern-input w-full"
              />
            </div>

            <div>
              <label htmlFor="arrivalTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Varış Saati *
              </label>
              <input
                type="datetime-local"
                id="arrivalTime"
                name="arrivalTime"
                value={formData.arrivalTime}
                onChange={handleChange}
                required
                className="modern-input w-full"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fiyat (₺) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="modern-input w-full"
                placeholder="Örn: 850"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Economy sınıfı için temel fiyat
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                Uçuş aktif
              </label>
            </div>
          </div>

          {/* Flight Info */}
          {formData.airline && formData.departure && formData.arrival && (
            <div className="modern-card-gradient p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Uçuş Bilgileri</h3>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-medium">Güzergah:</span> {formData.departure} → {formData.arrival}</p>
                <p><span className="font-medium">Havayolu:</span> {formData.airline}</p>
                <p><span className="font-medium">Uçuş No:</span> {formData.flightNumber}</p>
                {formData.departureTime && formData.arrivalTime && (
                  <p><span className="font-medium">Süre:</span> {
                    Math.round((new Date(formData.arrivalTime).getTime() - new Date(formData.departureTime).getTime()) / (1000 * 60 * 60 * 100)) / 10
                  } saat</p>
                )}
              </div>
            </div>
          )}

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
                  Uçuşu Kaydet
                </>
              )}
            </button>
            <Link href="/ucak/ucuslar" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

