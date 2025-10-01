"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function YeniGelirPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    description: "",
    source: "",
    reference: "",
    date: "",
    status: "pending",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/muhasebe/gelirler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          type: "income",
        }),
      });

      if (response.ok) {
        router.push("/muhasebe/gelirler");
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Yeni Gelir</h1>
          <p className="text-slate-600 dark:text-slate-400">Yeni bir gelir işlemi ekleyin</p>
        </div>
        <Link href="/muhasebe/gelirler" className="modern-button-secondary">
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
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kategori *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="">Kategori seçin...</option>
                <option value="otel">Otel</option>
                <option value="tur">Tur</option>
                <option value="transfer">Transfer</option>
                <option value="ucak">Uçak</option>
                <option value="saglik">Sağlık</option>
                <option value="diger">Diğer</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tutar (₺) *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="modern-input w-full"
                placeholder="Örn: 1500.00"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Açıklama *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Antalya otel rezervasyonu geliri"
              />
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kaynak *
              </label>
              <input
                type="text"
                id="source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Müşteri Adı, Banka, Kasa"
              />
            </div>

            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Referans
              </label>
              <input
                type="text"
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="modern-input w-full"
                placeholder="Örn: Fatura No, Rezervasyon No"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tarih *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="modern-input w-full"
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
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
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
              placeholder="Ek notlar, açıklamalar..."
            />
          </div>

          {/* Income Examples */}
          <div className="modern-card-gradient p-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Gelir Örnekleri</h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <p>• <span className="font-medium">Otel:</span> Müşteri rezervasyon ödemeleri</p>
              <p>• <span className="font-medium">Tur:</span> Tur paketi satışları</p>
              <p>• <span className="font-medium">Transfer:</span> Transfer hizmet ücretleri</p>
              <p>• <span className="font-medium">Uçak:</span> Bilet satış komisyonları</p>
              <p>• <span className="font-medium">Sağlık:</span> Sigorta poliçe primleri</p>
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
                  Geliri Kaydet
                </>
              )}
            </button>
            <Link href="/muhasebe/gelirler" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

