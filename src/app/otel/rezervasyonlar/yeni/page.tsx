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

interface CurrencyRates {
  TRY: { code: string; name: string; buying: number; selling: number; };
  USD: { code: string; name: string; buying: number; selling: number; };
  EUR: { code: string; name: string; buying: number; selling: number; };
}

export default function YeniRezervasyonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRates | null>(null);
  const [formData, setFormData] = useState({
    hotelId: "",
    customers: [{ name: "", phone: "", email: "" }],
    checkIn: "",
    checkOut: "",
    rooms: "",
    adults: "",
    children: "",
    totalAmount: "",
    currency: "TRY",
    paymentMethod: "",
    collectionMethod: "",
    paymentTiming: "",
    depositAmount: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    // Varsayılan tarihleri ayarla (bugün ve yarın)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData(prev => ({
      ...prev,
      checkIn: today.toISOString().split('T')[0],
      checkOut: tomorrow.toISOString().split('T')[0]
    }));

    // Fetch hotels
    fetch("/api/otel/oteller")
      .then(res => res.json())
      .then(data => {
        if (data.hotels) {
          setHotels(data.hotels);
        }
      })
      .catch(error => console.error("Error fetching hotels:", error));

    // Fetch currency rates
    fetch("/api/currency/rates")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.rates) {
          setCurrencyRates(data.rates);
        }
      })
      .catch(error => console.error("Error fetching currency rates:", error));
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

  const handleCustomerChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customers: prev.customers.map((customer, i) => 
        i === index ? { ...customer, [field]: value } : customer
      )
    }));
  };

  const addCustomer = () => {
    setFormData(prev => ({
      ...prev,
      customers: [...prev.customers, { name: "", phone: "", email: "" }]
    }));
  };

  const removeCustomer = (index: number) => {
    if (formData.customers.length > 1) {
      setFormData(prev => ({
        ...prev,
        customers: prev.customers.filter((_, i) => i !== index)
      }));
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols = { TRY: '₺', USD: '$', EUR: '€' };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  const formatCurrency = (amount: string, currency: string) => {
    if (!amount || !currency) return '';
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
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

            {/* Müşteri Bilgileri */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Müşteri Bilgileri ({formData.customers.length} kişi)
                </h3>
                <button
                  type="button"
                  onClick={addCustomer}
                  className="modern-button-secondary text-sm"
                >
                  + Müşteri Ekle
                </button>
              </div>
              
              {formData.customers.map((customer, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-700 dark:text-slate-300">
                      {index + 1}. Müşteri
                    </h4>
                    {formData.customers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCustomer(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        value={customer.name}
                        onChange={(e) => handleCustomerChange(index, 'name', e.target.value)}
                        required
                        className="modern-input w-full"
                        placeholder="Örn: Ahmet Yılmaz"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Telefon *
                      </label>
                      <input
                        type="tel"
                        value={customer.phone}
                        onChange={(e) => handleCustomerChange(index, 'phone', e.target.value)}
                        required
                        className="modern-input w-full"
                        placeholder="Örn: 0532 123 45 67"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customer.email}
                        onChange={(e) => handleCustomerChange(index, 'email', e.target.value)}
                        className="modern-input w-full"
                        placeholder="Örn: ahmet@example.com"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Para Birimi *
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="TRY">🇹🇷 Türk Lirası (₺)</option>
                <option value="EUR">🇪🇺 Euro (€)</option>
                <option value="USD">🇺🇸 Amerikan Doları ($)</option>
              </select>
              {currencyRates && formData.currency !== 'TRY' && (
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  1 {formData.currency} = {currencyRates[formData.currency as keyof CurrencyRates]?.selling.toFixed(2)} ₺
                </div>
              )}
            </div>

            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Toplam Fiyat ({getCurrencySymbol(formData.currency)}) *
              </label>
              <input
                type="number"
                id="totalAmount"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="modern-input w-full"
                placeholder={`Örn: ${formData.currency === 'TRY' ? '2500' : formData.currency === 'EUR' ? '75' : '85'}`}
              />
              {formData.totalAmount && formData.currency !== 'TRY' && currencyRates && (
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  ≈ ₺{(parseFloat(formData.totalAmount) * currencyRates[formData.currency as keyof CurrencyRates]?.selling).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
              )}
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
                  Kapora Tutarı ({getCurrencySymbol(formData.currency)}) *
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
                  step="0.01"
                  className="modern-input w-full md:w-1/3"
                  placeholder={`Örn: ${formData.currency === 'TRY' ? '500' : formData.currency === 'EUR' ? '15' : '18'}`}
                />
                {formData.depositAmount && formData.totalAmount && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Kalan tutar: {formatCurrency((parseFloat(formData.totalAmount) - parseFloat(formData.depositAmount)).toString(), formData.currency)}
                    {formData.currency !== 'TRY' && currencyRates && (
                      <span className="ml-2 text-xs">
                        (≈ ₺{((parseFloat(formData.totalAmount) - parseFloat(formData.depositAmount)) * currencyRates[formData.currency as keyof CurrencyRates]?.selling).toLocaleString('tr-TR', { minimumFractionDigits: 2 })})
                      </span>
                    )}
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

