"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function YeniAracPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    vehicleType: "",
    priceType: "fixed", // "fixed" or "perKm"
    fixedPrice: "",
    pricePerKm: "",
    distance: "",
    duration: "",
    description: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.from || !formData.to || !formData.vehicleType || !formData.priceType) {
      alert("Lütfen tüm gerekli alanları doldurun");
      setLoading(false);
      return;
    }

    if (formData.priceType === "fixed" && !formData.fixedPrice) {
      alert("Lütfen sabit fiyat girin");
      setLoading(false);
      return;
    }

    if (formData.priceType === "perKm" && !formData.pricePerKm) {
      alert("Lütfen KM başına fiyat girin");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/transfer/araclar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/transfer/araclar");
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Yeni Transfer Aracı</h1>
          <p className="text-slate-600 dark:text-slate-400">Yeni bir transfer aracı ekleyin</p>
        </div>
        <Link href="/transfer/araclar" className="modern-button-secondary">
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
              <label htmlFor="from" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kalkış Noktası *
              </label>
              <input
                type="text"
                id="from"
                name="from"
                value={formData.from}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: İstanbul Havalimanı"
              />
            </div>

            <div>
              <label htmlFor="to" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Varış Noktası *
              </label>
              <input
                type="text"
                id="to"
                name="to"
                value={formData.to}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Sultanahmet"
              />
            </div>

            <div>
              <label htmlFor="vehicleType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Araç Tipi *
              </label>
              <select
                id="vehicleType"
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="">Araç tipi seçin...</option>
                <option value="Sedan">Sedan (4 kişi)</option>
                <option value="Minivan">Minivan (8 kişi)</option>
                <option value="Minibüs">Minibüs (16 kişi)</option>
                <option value="Otobüs">Otobüs (45 kişi)</option>
                <option value="VIP Sedan">VIP Sedan (4 kişi)</option>
                <option value="VIP Minivan">VIP Minivan (8 kişi)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fiyatlandırma *
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="fixedPrice"
                    name="priceType"
                    value="fixed"
                    checked={formData.priceType === "fixed"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="fixedPrice" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                    Sabit Fiyat
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="perKmPrice"
                    name="priceType"
                    value="perKm"
                    checked={formData.priceType === "perKm"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="perKmPrice" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                    KM Başına Fiyat
                  </label>
                </div>
              </div>
            </div>

            {formData.priceType === "fixed" && (
              <div>
                <label htmlFor="fixedPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sabit Fiyat (₺) *
                </label>
                <input
                  type="number"
                  id="fixedPrice"
                  name="fixedPrice"
                  value={formData.fixedPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="modern-input w-full"
                  placeholder="Örn: 150.00"
                />
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Transfer için sabit ücret
                </p>
              </div>
            )}

            {formData.priceType === "perKm" && (
              <div>
                <label htmlFor="pricePerKm" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  KM Başına Fiyat (₺) *
                </label>
                <input
                  type="number"
                  id="pricePerKm"
                  name="pricePerKm"
                  value={formData.pricePerKm}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="modern-input w-full"
                  placeholder="Örn: 5.50"
                />
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Kilometre başına ücret
                </p>
              </div>
            )}

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
                Araç aktif
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Açıklama
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="modern-input w-full"
              placeholder="Transfer hakkında ek bilgiler..."
            />
          </div>

          {/* Vehicle Type Info */}
          {formData.vehicleType && (
            <div className="modern-card-gradient p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Araç Tipi Bilgileri</h3>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {formData.vehicleType === "Sedan" && (
                  <p>• Standart sedan araç, şehir içi transferler için ideal<br/>• Konforlu yolculuk, ekonomik fiyat</p>
                )}
                {formData.vehicleType === "Minivan" && (
                  <p>• Aile grupları için ideal<br/>• Geniş bagaj alanı, konforlu yolculuk</p>
                )}
                {formData.vehicleType === "Minibüs" && (
                  <p>• Küçük gruplar için ideal<br/>• Ekonomik grup transferi</p>
                )}
                {formData.vehicleType === "Otobüs" && (
                  <p>• Büyük gruplar için ideal<br/>• Uzun mesafe transferler</p>
                )}
                {formData.vehicleType === "VIP Sedan" && (
                  <p>• Premium konfor<br/>• Lüks sedan araç, özel hizmet</p>
                )}
                {formData.vehicleType === "VIP Minivan" && (
                  <p>• Premium grup transferi<br/>• Lüks minivan, özel hizmet</p>
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
                  Aracı Kaydet
                </>
              )}
            </button>
            <Link href="/transfer/araclar" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

