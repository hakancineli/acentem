"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function YeniSigortaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider: "",
    planName: "",
    coverage: "",
    price: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/saglik/sigortalar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/saglik/sigortalar");
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Yeni Sağlık Sigortası</h1>
          <p className="text-slate-600 dark:text-slate-400">Yeni bir sağlık sigortası ekleyin</p>
        </div>
        <Link href="/saglik/sigortalar" className="modern-button-secondary">
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
              <label htmlFor="provider" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sigorta Sağlayıcısı *
              </label>
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="">Sağlayıcı seçin...</option>
                <option value="Allianz">Allianz</option>
                <option value="Axa">Axa</option>
                <option value="Generali">Generali</option>
                <option value="HDI Sigorta">HDI Sigorta</option>
                <option value="Mapfre">Mapfre</option>
                <option value="Neon">Neon</option>
                <option value="Sompo Japan">Sompo Japan</option>
                <option value="Türkiye Sigorta">Türkiye Sigorta</option>
                <option value="Zurich">Zurich</option>
              </select>
            </div>

            <div>
              <label htmlFor="planName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Plan Adı *
              </label>
              <input
                type="text"
                id="planName"
                name="planName"
                value={formData.planName}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Seyahat Sağlık Sigortası"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="coverage" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kapsam *
              </label>
              <textarea
                id="coverage"
                name="coverage"
                value={formData.coverage}
                onChange={handleChange}
                required
                rows={4}
                className="modern-input w-full"
                placeholder="Sigorta kapsamını detaylı olarak açıklayın..."
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Yıllık Prim (₺) *
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
                placeholder="Örn: 2500"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Yıllık sigorta primi
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
                Sigorta aktif
              </label>
            </div>
          </div>

          {/* Coverage Examples */}
          <div className="modern-card-gradient p-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Kapsam Örnekleri</h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <p>• Acil tıbbi müdahale: 50.000 €</p>
              <p>• Hastane masrafları: 100.000 €</p>
              <p>• Ambulans hizmetleri: Dahil</p>
              <p>• Repatriasyon: Dahil</p>
              <p>• Seyahat iptali: 2.000 €</p>
              <p>• Bagaj kaybı: 1.000 €</p>
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
                  Sigortayı Kaydet
                </>
              )}
            </button>
            <Link href="/saglik/sigortalar" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

