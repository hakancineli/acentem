"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Insurance {
  id: string;
  provider: string;
  planName: string;
  price: number;
}

export default function YeniPoliçePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null);
  const [formData, setFormData] = useState({
    insuranceId: "",
    policyNumber: "",
    holderName: "",
    holderEmail: "",
    startDate: "",
    endDate: "",
    premium: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    // Fetch insurances
    fetch("/api/saglik/sigortalar")
      .then(res => res.json())
      .then(data => {
        if (data.insurances) {
          setInsurances(data.insurances);
        }
      })
      .catch(error => console.error("Error fetching insurances:", error));
  }, []);

  useEffect(() => {
    // Update selected insurance when insuranceId changes
    if (formData.insuranceId) {
      const insurance = insurances.find(i => i.id === formData.insuranceId);
      setSelectedInsurance(insurance || null);
    }
  }, [formData.insuranceId, insurances]);

  useEffect(() => {
    // Calculate premium when insurance is selected
    if (selectedInsurance && formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const yearlyPremium = selectedInsurance.price;
      const dailyPremium = yearlyPremium / 365;
      const totalPremium = Math.round(dailyPremium * daysDiff);
      
      setFormData(prev => ({ ...prev, premium: totalPremium.toString() }));
    }
  }, [selectedInsurance, formData.startDate, formData.endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/saglik/policeler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/saglik/policeler");
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

  const generatePolicyNumber = () => {
    const prefix = selectedInsurance?.provider.substring(0, 3).toUpperCase() || "POL";
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}${random}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Yeni Sağlık Poliçesi</h1>
          <p className="text-slate-600 dark:text-slate-400">Yeni bir sağlık poliçesi oluşturun</p>
        </div>
        <Link href="/saglik/policeler" className="modern-button-secondary">
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
              <label htmlFor="insuranceId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sigorta *
              </label>
              <select
                id="insuranceId"
                name="insuranceId"
                value={formData.insuranceId}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="">Sigorta seçin...</option>
                {insurances.map((insurance) => (
                  <option key={insurance.id} value={insurance.id}>
                    {insurance.provider} - {insurance.planName} (₺{insurance.price}/yıl)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="policyNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Poliçe Numarası *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="policyNumber"
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleChange}
                  required
                  className="modern-input flex-1"
                  placeholder="Otomatik oluşturulur"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, policyNumber: generatePolicyNumber() }))}
                  className="modern-button-secondary"
                >
                  Oluştur
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="holderName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sigortalı Adı *
              </label>
              <input
                type="text"
                id="holderName"
                name="holderName"
                value={formData.holderName}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>

            <div>
              <label htmlFor="holderEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sigortalı Email *
              </label>
              <input
                type="email"
                id="holderEmail"
                name="holderEmail"
                value={formData.holderEmail}
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
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Bitiş Tarihi *
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
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
                <option value="active">Aktif</option>
                <option value="expired">Süresi Dolmuş</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
            </div>

            <div>
              <label htmlFor="premium" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Toplam Prim (₺) *
              </label>
              <input
                type="number"
                id="premium"
                name="premium"
                value={formData.premium}
                onChange={handleChange}
                required
                min="0"
                className="modern-input w-full"
                placeholder="Otomatik hesaplanır"
              />
              {selectedInsurance && formData.startDate && formData.endDate && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Günlük prim: ₺{(selectedInsurance.price / 365).toFixed(2)} × {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} gün = ₺{formData.premium}
                </p>
              )}
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
              placeholder="Özel durumlar, notlar..."
            />
          </div>

          {/* Insurance Details */}
          {selectedInsurance && (
            <div className="modern-card-gradient p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Sigorta Detayları</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-medium">Sağlayıcı:</span> {selectedInsurance.provider}
                </div>
                <div>
                  <span className="font-medium">Plan:</span> {selectedInsurance.planName}
                </div>
                <div>
                  <span className="font-medium">Yıllık Prim:</span> ₺{selectedInsurance.price.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Günlük Prim:</span> ₺{(selectedInsurance.price / 365).toFixed(2)}
                </div>
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
                  Poliçeyi Kaydet
                </>
              )}
            </button>
            <Link href="/saglik/policeler" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

