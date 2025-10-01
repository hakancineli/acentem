"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function YeniAracPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: "",
    vehicleType: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    capacity: "",
    fuelType: "",
    driverName: "",
    driverPhone: "",
    driverLicense: "",
    isActive: true,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.plateNumber || !formData.vehicleType || !formData.brand || !formData.model || !formData.driverName || !formData.driverPhone) {
      alert("Lütfen tüm gerekli alanları doldurun");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          <p className="text-slate-600 dark:text-slate-400">Şirket filosuna yeni bir araç ekleyin</p>
        </div>
        <Link href="/transfer/araclar" className="modern-button-secondary">
          Geri Dön
        </Link>
      </div>

      {/* Form */}
      <div className="modern-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plaka */}
            <div>
              <label htmlFor="plateNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Plaka *
              </label>
              <input
                type="text"
                id="plateNumber"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: 34 ABC 123"
              />
            </div>

            {/* Araç Tipi */}
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

            {/* Marka */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Marka *
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Mercedes, BMW, Ford"
              />
            </div>

            {/* Model */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Model *
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Vito, Sprinter, Transit"
              />
            </div>

            {/* Yıl */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Model Yılı
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1990"
                max="2025"
                className="modern-input w-full"
                placeholder="Örn: 2023"
              />
            </div>

            {/* Renk */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Renk
              </label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="modern-input w-full"
                placeholder="Örn: Beyaz, Siyah, Gri"
              />
            </div>

            {/* Kapasite */}
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kapasite
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                max="50"
                className="modern-input w-full"
                placeholder="Örn: 8"
              />
            </div>

            {/* Yakıt Tipi */}
            <div>
              <label htmlFor="fuelType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Yakıt Tipi
              </label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                className="modern-input w-full"
              >
                <option value="">Yakıt tipi seçin...</option>
                <option value="Benzin">Benzin</option>
                <option value="Dizel">Dizel</option>
                <option value="Hibrit">Hibrit</option>
                <option value="Elektrik">Elektrik</option>
                <option value="LPG">LPG</option>
              </select>
            </div>
          </div>

          {/* Şoför Bilgileri */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Şoför Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Şoför Adı */}
              <div>
                <label htmlFor="driverName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Şoför Adı *
                </label>
                <input
                  type="text"
                  id="driverName"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                  required
                  className="modern-input w-full"
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>

              {/* Şoför Telefonu */}
              <div>
                <label htmlFor="driverPhone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Şoför Telefonu *
                </label>
                <input
                  type="tel"
                  id="driverPhone"
                  name="driverPhone"
                  value={formData.driverPhone}
                  onChange={handleChange}
                  required
                  className="modern-input w-full"
                  placeholder="Örn: +90 555 123 45 67"
                />
              </div>

              {/* Ehliyet Numarası */}
              <div>
                <label htmlFor="driverLicense" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ehliyet Numarası
                </label>
                <input
                  type="text"
                  id="driverLicense"
                  name="driverLicense"
                  value={formData.driverLicense}
                  onChange={handleChange}
                  className="modern-input w-full"
                  placeholder="Örn: 12345678901"
                />
              </div>
            </div>
          </div>

          {/* Notlar */}
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
              placeholder="Araç hakkında ek bilgiler..."
            />
          </div>

          {/* Aktif Durumu */}
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

          {/* Butonlar */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="modern-button flex-1"
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