"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function AracDuzenlePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/arac/araclar/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(setVehicle)
      .catch(() => setError("Araç yüklenemedi"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      const res = await fetch(`/api/arac/araclar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Güncelleme başarısız");
      router.push(`/arac/araclar/${id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Yükleniyor...</div>;
  if (error || !vehicle) return <div className="p-6">{error || "Araç bulunamadı"}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Aracı Düzenle</h1>
        <Link href={`/arac/araclar/${id}`} className="modern-button-secondary">İptal</Link>
      </div>
      <div className="modern-card p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Temel */}
          <div>
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Marka</label>
            <input name="brand" defaultValue={vehicle.brand} className="modern-input" required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Model</label>
            <input name="model" defaultValue={vehicle.model} className="modern-input" required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Yıl</label>
            <input name="year" type="number" defaultValue={vehicle.year} className="modern-input" required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Plaka</label>
            <input name="plate" defaultValue={vehicle.plate} className="modern-input" required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Renk</label>
            <input name="color" defaultValue={vehicle.color} className="modern-input" required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Konum</label>
            <input name="location" defaultValue={vehicle.location} className="modern-input" required />
          </div>

          {/* Teknik */}
          <div>
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Yakıt</label>
            <select name="fuel" defaultValue={vehicle.fuel} className="modern-input">
              <option value="benzin">Benzin</option>
              <option value="dizel">Dizel</option>
              <option value="hybrid">Hibrit</option>
              <option value="elektrik">Elektrik</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Vites</label>
            <select name="transmission" defaultValue={vehicle.transmission} className="modern-input">
              <option value="manuel">Manuel</option>
              <option value="otomatik">Otomatik</option>
            </select>
          </div>
          <div className="relative">
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Koltuk</label>
            <input name="seats" type="number" defaultValue={vehicle.seats} className="modern-input pr-12" />
            <span className="absolute right-3 top-9 text-xs text-slate-500">kişi</span>
          </div>
          <div className="relative">
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Kapı</label>
            <input name="doors" type="number" defaultValue={vehicle.doors} className="modern-input pr-12" />
            <span className="absolute right-3 top-9 text-xs text-slate-500">kapı</span>
          </div>
          <div className="relative">
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Motor</label>
            <input name="engine" defaultValue={vehicle.engine || ""} className="modern-input pr-10" />
            <span className="absolute right-3 top-9 text-xs text-slate-500">L</span>
          </div>

          {/* Fiyatlar */}
          <div className="relative">
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Günlük</label>
            <input name="dailyRate" type="number" step="1" defaultValue={vehicle.dailyRate} className="modern-input pr-10" />
            <span className="absolute right-3 top-9 text-xs text-slate-500">TL</span>
          </div>
          <div className="relative">
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Haftalık</label>
            <input name="weeklyRate" type="number" step="1" defaultValue={vehicle.weeklyRate ?? ""} className="modern-input pr-10" />
            <span className="absolute right-3 top-9 text-xs text-slate-500">TL</span>
          </div>
          <div className="relative">
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Aylık</label>
            <input name="monthlyRate" type="number" step="1" defaultValue={vehicle.monthlyRate ?? ""} className="modern-input pr-10" />
            <span className="absolute right-3 top-9 text-xs text-slate-500">TL</span>
          </div>
          <div className="relative">
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Depozito</label>
            <input name="deposit" type="number" step="1" defaultValue={vehicle.deposit ?? ""} className="modern-input pr-10" />
            <span className="absolute right-3 top-9 text-xs text-slate-500">TL</span>
          </div>

          {/* Diğer */}
          <div>
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Durum</label>
            <select name="status" defaultValue={vehicle.status} className="modern-input">
              <option value="available">Müsait</option>
              <option value="rented">Kiralık</option>
              <option value="maintenance">Bakımda</option>
              <option value="out_of_service">Servis Dışı</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" name="isActive" defaultChecked={vehicle.isActive} className="h-4 w-4" /> Aktif
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Açıklama</label>
            <textarea name="description" defaultValue={vehicle.description || ""} rows={3} className="modern-input" />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="modern-button" disabled={loading}>{loading ? "Kaydediliyor..." : "Kaydet"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


