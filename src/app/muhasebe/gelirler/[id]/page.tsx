"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  source: string;
  reference?: string;
  date: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditTransactionPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    type: "income",
    category: "",
    amount: "",
    description: "",
    source: "",
    reference: "",
    date: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/muhasebe/gelirler/${transactionId}`);
      if (!response.ok) {
        throw new Error("Transaction bulunamadı");
      }
      const data = await response.json();
      setTransaction(data);
      setFormData({
        type: data.type,
        category: data.category,
        amount: data.amount.toString(),
        description: data.description,
        source: data.source,
        reference: data.reference || "",
        date: data.date.split("T")[0],
        status: data.status,
        notes: data.notes || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/muhasebe/gelirler/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount: parseInt(formData.amount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Güncelleme başarısız");
      }

      const updatedTransaction = await response.json();
      setTransaction(updatedTransaction);
      
      // Başarı mesajı göster ve listeye dön
      alert("Transaction başarıyla güncellendi!");
      router.push("/muhasebe/gelirler");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Hata</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <Link href="/muhasebe/gelirler" className="modern-button">Gelirler Listesine Dön</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Gelir Düzenle</h1>
          <p className="text-slate-600 dark:text-slate-400">Transaction bilgilerini güncelleyin</p>
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
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sol Kolon */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Açıklama *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                  placeholder="Gelir açıklaması"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kaynak *
                </label>
                <input
                  type="text"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                  placeholder="Gelir kaynağı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kategori *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                >
                  <option value="">Kategori seçin</option>
                  <option value="arac">Araç</option>
                  <option value="otel">Otel</option>
                  <option value="tur">Tur</option>
                  <option value="transfer">Transfer</option>
                  <option value="ucak">Uçak</option>
                  <option value="saglik">Sağlık</option>
                  <option value="diger">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tutar (₺) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="modern-input w-full"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Sağ Kolon */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Referans
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                  placeholder="Referans numarası"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tarih *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Durum *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                >
                  <option value="pending">Beklemede</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notlar
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="modern-input w-full"
                  placeholder="Ek notlar"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Link href="/muhasebe/gelirler" className="modern-button-secondary">
              İptal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="modern-button"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Güncelle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
