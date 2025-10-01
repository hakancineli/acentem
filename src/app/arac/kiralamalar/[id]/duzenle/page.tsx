"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function KiralamaDuzenlePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [rental, setRental] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/arac/kiralamalar/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setRental)
      .catch(() => setError("Kiralama yüklenemedi"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      const res = await fetch(`/api/arac/kiralamalar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Güncelleme başarısız");
      // Güncellemeden sonra voucher değişiklikleri yansısın diye geri listeye dön
      router.push("/arac");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Yükleniyor...</div>;
  if (error || !rental) return <div className="p-6">{error || "Kiralama bulunamadı"}</div>;

  const toInputDate = (d: string) => new Date(d).toISOString().slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kiralama Düzenle</h1>
        <Link href="/arac" className="modern-button-secondary">İptal</Link>
      </div>
      <div className="modern-card p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-1">Başlangıç</label>
            <input name="startDate" type="date" defaultValue={toInputDate(rental.startDate)} className="modern-input" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Bitiş</label>
            <input name="endDate" type="date" defaultValue={toInputDate(rental.endDate)} className="modern-input" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Günlük Ücret (TL)</label>
            <input name="dailyRate" type="number" step="1" defaultValue={rental.dailyRate} className="modern-input" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Durum</label>
            <select name="status" defaultValue={rental.status} className="modern-input">
              <option value="active">Aktif</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal</option>
              <option value="overdue">Gecikmiş</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Notlar</label>
            <textarea name="notes" defaultValue={rental.notes || ""} rows={3} className="modern-input" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="modern-button" disabled={loading}>{loading ? "Kaydediliyor..." : "Kaydet"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


