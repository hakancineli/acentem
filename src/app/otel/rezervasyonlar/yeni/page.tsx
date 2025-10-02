"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Hotel {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  stars: number;
}

export default function YeniRezervasyonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState({
    hotelId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    checkIn: "",
    checkOut: "",
    rooms: "",
    adults: "",
    children: "",
    totalAmount: "",
    paymentMethod: "",
    collectionMethod: "",
    paymentTiming: "",
    depositAmount: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    // Fetch hotels
    fetch("/api/otel/oteller")
      .then(res => res.json())
      .then(data => {
        if (data.hotels) {
          setHotels(data.hotels);
        }
      })
      .catch(error => console.error("Error fetching hotels:", error));
  }, []);

  useEffect(() => {
    // Update selected hotel when hotelId changes
    if (formData.hotelId) {
      const hotel = hotels.find(h => h.id === formData.hotelId);
      setSelectedHotel(hotel || null);
    }
  }, [formData.hotelId, hotels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/otel/rezervasyonlar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/otel/rezervasyonlar");
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

  const calculateNights = () => {
    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const nights = calculateNights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Yeni Otel Rezervasyonu</h1>
          <p className="text-slate-600 dark:text-slate-400">Yeni bir otel rezervasyonu oluşturun</p>
        </div>
        <Link href="/otel/rezervasyonlar" className="modern-button-secondary">
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
              <label htmlFor="hotelId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Otel *
              </label>
              <select
                id="hotelId"
                name="hotelId"
                value={formData.hotelId}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="">Otel seçin...</option>
                {/* Group hotels by city */}
                {Object.entries(
                  hotels.reduce((acc, hotel) => {
                    if (!acc[hotel.city]) {
                      acc[hotel.city] = [];
                    }
                    acc[hotel.city].push(hotel);
                    return acc;
                  }, {} as Record<string, Hotel[]>)
                ).map(([city, cityHotels]) => (
                  <optgroup key={city} label={`${city} (${cityHotels.length} otel)`}>
                    {cityHotels
                      .sort((a, b) => b.stars - a.stars) // Sort by stars descending
                      .map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {"★".repeat(hotel.stars)} {hotel.name} - {hotel.location}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              {selectedHotel && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="text-yellow-500">
                      {"★".repeat(selectedHotel.stars)}
                    </div>
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {selectedHotel.name}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    📍 {selectedHotel.location}, {selectedHotel.city}, {selectedHotel.country}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Müşteri Adı *
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>

            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Müşteri Telefon *
              </label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: 0532 123 45 67"
              />
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Müşteri Email
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                className="modern-input w-full"
                placeholder="Örn: ahmet@example.com"
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
                <option value="confirmed">Onaylandı</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
            </div>

            <div>
              <label htmlFor="checkIn" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Giriş Tarihi *
              </label>
              <input
                type="date"
                id="checkIn"
                name="checkIn"
                value={formData.checkIn}
                onChange={handleChange}
                required
                className="modern-input w-full"
              />
            </div>

            <div>
              <label htmlFor="checkOut" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Çıkış Tarihi *
              </label>
              <input
                type="date"
                id="checkOut"
                name="checkOut"
                value={formData.checkOut}
                onChange={handleChange}
                required
                className="modern-input w-full"
              />
              {nights > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {nights} gece konaklama
                </p>
              )}
            </div>

            <div>
              <label htmlFor="rooms" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Oda Sayısı *
              </label>
              <input
                type="number"
                id="rooms"
                name="rooms"
                value={formData.rooms}
                onChange={handleChange}
                required
                min="1"
                className="modern-input w-full"
                placeholder="Örn: 1"
              />
            </div>

            <div>
              <label htmlFor="adults" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Yetişkin Sayısı *
              </label>
              <input
                type="number"
                id="adults"
                name="adults"
                value={formData.adults}
                onChange={handleChange}
                required
                min="1"
                className="modern-input w-full"
                placeholder="Örn: 2"
              />
            </div>

            <div>
              <label htmlFor="children" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Çocuk Sayısı
              </label>
              <input
                type="number"
                id="children"
                name="children"
                value={formData.children}
                onChange={handleChange}
                min="0"
                className="modern-input w-full"
                placeholder="Örn: 1"
              />
            </div>

            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Toplam Fiyat (₺) *
              </label>
              <input
                type="number"
                id="totalAmount"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                min="0"
                className="modern-input w-full"
                placeholder="Örn: 2500"
              />
            </div>
          </div>

          {/* Ödeme Detayları */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Ödeme Detayları</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ödeme Yöntemi *
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="modern-input w-full"
                >
                  <option value="">Seçiniz</option>
                  <option value="nakit">Nakit</option>
                  <option value="havale">Havale/EFT</option>
                  <option value="kredi_karti">Kredi Kartı</option>
                </select>
              </div>

              <div>
                <label htmlFor="collectionMethod" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tahsilat Yeri *
                </label>
                <select
                  id="collectionMethod"
                  name="collectionMethod"
                  value={formData.collectionMethod}
                  onChange={handleChange}
                  required
                  className="modern-input w-full"
                >
                  <option value="">Seçiniz</option>
                  <option value="ofiste">Ofiste</option>
                  <option value="otelde">Otelde</option>
                  <option value="online">Online</option>
                  <option value="kapida">Kapıda</option>
                </select>
              </div>

              <div>
                <label htmlFor="paymentTiming" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ödeme Şekli *
                </label>
                <select
                  id="paymentTiming"
                  name="paymentTiming"
                  value={formData.paymentTiming}
                  onChange={handleChange}
                  required
                  className="modern-input w-full"
                >
                  <option value="">Seçiniz</option>
                  <option value="pesin">Peşin</option>
                  <option value="kapora">Kapora</option>
                </select>
              </div>
            </div>

            {formData.paymentTiming === "kapora" && (
              <div className="mt-4">
                <label htmlFor="depositAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kapora Tutarı (₺) *
                </label>
                <input
                  type="number"
                  id="depositAmount"
                  name="depositAmount"
                  value={formData.depositAmount}
                  onChange={handleChange}
                  required={formData.paymentTiming === "kapora"}
                  min="0"
                  max={formData.totalAmount}
                  className="modern-input w-full md:w-1/3"
                  placeholder="Örn: 500"
                />
                {formData.depositAmount && formData.totalAmount && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Kalan tutar: ₺{(parseInt(formData.totalAmount) - parseInt(formData.depositAmount)).toLocaleString()}
                  </p>
                )}
              </div>
            )}
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
              placeholder="Özel istekler, notlar..."
            />
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
                  Rezervasyonu Kaydet
                </>
              )}
            </button>
            <Link href="/otel/rezervasyonlar" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

