"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function YeniSoforPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    commission: 20, // varsayılan %20 komisyon
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/soforler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/soforler");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "commission" ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Yeni Şoför</h1>
          <p className="text-slate-600 dark:text-slate-400">Yeni şoför bilgilerini ekleyin</p>
        </div>
      </div>

      {/* Form */}
      <div className="modern-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Şoför Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Şoför Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Şoför Adı *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="modern-input"
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Telefon *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="modern-input"
                  placeholder="0555 123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Komisyon Oranı (%) *
                </label>
                <input
                  type="number"
                  name="commission"
                  value={formData.commission}
                  onChange={handleChange}
                  required
                  min="0"
                  max="100"
                  className="modern-input"
                  placeholder="20"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Şoförün her işten alacağı komisyon yüzdesi
                </p>
              </div>
            </div>
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
            <Link href="/soforler" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
