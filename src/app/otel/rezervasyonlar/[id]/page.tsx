"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Customer = { name: string; phone: string; email?: string };

interface Reservation {
  id: string;
  hotelId: string;
  hotel?: { id: string; name: string };
  customers: string; // JSON string
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  adults: number;
  children: number;
  totalAmount: number;
  currency: string;
  exchangeRate?: number | null;
  paymentMethod?: string | null;
  collectionMethod?: string | null;
  paymentTiming?: string | null;
  depositAmount?: number | null;
  remainingAmount?: number | null;
  status: string;
  notes?: string | null;
  createdAt: string;
}

export default function OtelRezervasyonDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  const [form, setForm] = useState({
    status: "pending",
    paymentMethod: "",
    collectionMethod: "",
    paymentTiming: "",
    depositAmount: "",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const { id } = await params;
        const res = await fetch(`/api/otel/rezervasyonlar/${id}`);
        if (!res.ok) throw new Error("Rezervasyon getirilemedi");
        const data = await res.json();
        const r: Reservation = data.reservation || data; // backward compat
        setReservation(r);
        setForm({
          status: r.status || "pending",
          paymentMethod: r.paymentMethod || "",
          collectionMethod: r.collectionMethod || "",
          paymentTiming: r.paymentTiming || "",
          depositAmount: r.depositAmount ? String(r.depositAmount) : "",
          notes: r.notes || "",
        });
      } catch (e: any) {
        setError(e?.message || "Bilinmeyen hata");
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/otel/rezervasyonlar/${reservation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          paymentMethod: form.paymentMethod || undefined,
          collectionMethod: form.collectionMethod || undefined,
          paymentTiming: form.paymentTiming || undefined,
          depositAmount: form.depositAmount || undefined,
          notes: form.notes ?? "",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Kaydedilirken hata oluştu");
      }
      router.push("/otel/rezervasyonlar");
    } catch (e: any) {
      setError(e?.message || "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">Yükleniyor…</div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="space-y-6">
        <div className="modern-card p-6">
          <div className="text-red-600 dark:text-red-400">{error || "Rezervasyon bulunamadı"}</div>
          <div className="mt-4">
            <Link href="/otel/rezervasyonlar" className="modern-button-secondary">Geri Dön</Link>
          </div>
        </div>
      </div>
    );
  }

  const customers: Customer[] = (() => {
    try { return JSON.parse(reservation.customers || "[]"); } catch { return []; }
  })();

  const symbols: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };
  const symbol = symbols[reservation.currency] || reservation.currency;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Rezervasyon Düzenle</h1>
          <p className="text-slate-600 dark:text-slate-400">Durumu ve ödeme detaylarını güncelleyin</p>
        </div>
        <Link href="/otel/rezervasyonlar" className="modern-button-secondary">Geri Dön</Link>
      </div>

      <div className="modern-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Otel</div>
            <div className="text-base font-medium">{reservation.hotel?.name || reservation.hotelId}</div>
          </div>
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Tutar</div>
            <div className="text-base font-medium">
              {symbol}{reservation.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              {reservation.currency !== "TRY" && (
                <span className="ml-2 text-xs text-slate-500">(≈₺{(reservation.totalAmount * (reservation.exchangeRate || 1)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })})</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Tarih</div>
            <div className="text-base font-medium">
              {new Date(reservation.checkIn).toLocaleDateString("tr-TR")} – {new Date(reservation.checkOut).toLocaleDateString("tr-TR")} ({reservation.nights} gece)
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Kişiler</div>
            <div className="text-base font-medium">{reservation.rooms} oda, {reservation.adults} yetişkin{reservation.children > 0 ? `, ${reservation.children} çocuk` : ""}</div>
          </div>
        </div>

        {customers.length > 0 && (
          <div className="mt-6 p-4 rounded bg-slate-50 dark:bg-slate-800/50">
            <div className="text-sm font-medium mb-2">👥 Müşteriler</div>
            <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {customers.map((c, i) => (
                <div key={i} className="flex flex-wrap gap-3">
                  <span className="font-medium">{i + 1}.</span>
                  <span>{c.name}</span>
                  <span>📞 {c.phone}</span>
                  {c.email ? <span>✉️ {c.email}</span> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Durum</label>
            <select name="status" value={form.status} onChange={handleChange} className="modern-input w-full">
              <option value="pending">Beklemede</option>
              <option value="confirmed">Onaylandı</option>
              <option value="cancelled">İptal</option>
            </select>
            <div className="text-xs text-slate-500 mt-1">Onaylandığında muhasebe kaydı otomatik tamamlanır.</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ödeme Yöntemi</label>
            <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="modern-input w-full">
              <option value="">Seçiniz</option>
              <option value="nakit">Nakit</option>
              <option value="havale">Havale/EFT</option>
              <option value="kredi_karti">Kredi Kartı</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tahsilat Yeri</label>
            <select name="collectionMethod" value={form.collectionMethod} onChange={handleChange} className="modern-input w-full">
              <option value="">Seçiniz</option>
              <option value="ofiste">Ofiste</option>
              <option value="otelde">Otelde</option>
              <option value="online">Online</option>
              <option value="kapida">Kapıda</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ödeme Şekli</label>
            <select name="paymentTiming" value={form.paymentTiming} onChange={handleChange} className="modern-input w-full">
              <option value="">Seçiniz</option>
              <option value="pesin">Peşin</option>
              <option value="kapora">Kapora</option>
            </select>
          </div>

          {form.paymentTiming === "kapora" && (
            <div>
              <label className="block text-sm font-medium mb-2">Kapora Tutarı</label>
              <input
                type="number"
                name="depositAmount"
                value={form.depositAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="modern-input w-full"
                placeholder="Örn: 50"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Notlar</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="modern-input w-full" placeholder="Notlar" />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={saving} className="modern-button">
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <Link href="/otel/rezervasyonlar" className="modern-button-secondary">İptal</Link>
          </div>
        </form>
      </div>
    </div>
  );
}


