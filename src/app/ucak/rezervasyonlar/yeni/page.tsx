"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
}

export default function YeniRezervasyonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [formData, setFormData] = useState({
    flightId: "",
    passengerName: "",
    passengerEmail: "",
    seatClass: "",
    totalAmount: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    // Fetch flights
    fetch("/api/ucak/ucuslar")
      .then(res => res.json())
      .then(data => {
        if (data.flights) {
          setFlights(data.flights);
        }
      })
      .catch(error => console.error("Error fetching flights:", error));
  }, []);

  useEffect(() => {
    // Update selected flight when flightId changes
    if (formData.flightId) {
      const flight = flights.find(f => f.id === formData.flightId);
      setSelectedFlight(flight || null);
    }
  }, [formData.flightId, flights]);

  useEffect(() => {
    // Calculate total price when flight and seat class are selected
    if (selectedFlight && formData.seatClass) {
      let multiplier = 1;
      if (formData.seatClass === "business") multiplier = 2.5;
      if (formData.seatClass === "first") multiplier = 4;
      
      const totalAmount = selectedFlight.price * multiplier;
      setFormData(prev => ({ ...prev, totalAmount: totalAmount.toString() }));
    }
  }, [selectedFlight, formData.seatClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/ucak/rezervasyonlar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/ucak/rezervasyonlar");
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Yeni Uçak Rezervasyonu</h1>
          <p className="text-slate-600 dark:text-slate-400">Yeni bir uçak rezervasyonu oluşturun</p>
        </div>
        <Link href="/ucak/rezervasyonlar" className="modern-button-secondary">
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
              <label htmlFor="flightId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Uçuş *
              </label>
              <select
                id="flightId"
                name="flightId"
                value={formData.flightId}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="">Uçuş seçin...</option>
                {flights.map((flight) => (
                  <option key={flight.id} value={flight.id}>
                    {flight.airline} {flight.flightNumber} - {flight.departure} → {flight.arrival} (₺{flight.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="passengerName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Yolcu Adı *
              </label>
              <input
                type="text"
                id="passengerName"
                name="passengerName"
                value={formData.passengerName}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>

            <div>
              <label htmlFor="passengerEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Yolcu Email *
              </label>
              <input
                type="email"
                id="passengerEmail"
                name="passengerEmail"
                value={formData.passengerEmail}
                onChange={handleChange}
                required
                className="modern-input w-full"
                placeholder="Örn: ahmet@example.com"
              />
            </div>

            <div>
              <label htmlFor="seatClass" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sınıf *
              </label>
              <select
                id="seatClass"
                name="seatClass"
                value={formData.seatClass}
                onChange={handleChange}
                required
                className="modern-input w-full"
              >
                <option value="">Sınıf seçin...</option>
                <option value="economy">Economy Class</option>
                <option value="business">Business Class</option>
                <option value="first">First Class</option>
              </select>
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
                placeholder="Otomatik hesaplanır"
              />
              {selectedFlight && formData.seatClass && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {formData.seatClass === "economy" ? "Economy" :
                   formData.seatClass === "business" ? "Business (2.5x)" : "First Class (4x)"} × ₺{selectedFlight.price} = ₺{formData.totalAmount}
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
              placeholder="Özel istekler, notlar..."
            />
          </div>

          {/* Flight Details */}
          {selectedFlight && (
            <div className="modern-card-gradient p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Uçuş Detayları</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-medium">Havayolu:</span> {selectedFlight.airline}
                </div>
                <div>
                  <span className="font-medium">Uçuş No:</span> {selectedFlight.flightNumber}
                </div>
                <div>
                  <span className="font-medium">Güzergah:</span> {selectedFlight.departure} → {selectedFlight.arrival}
                </div>
                <div>
                  <span className="font-medium">Kalkış:</span> {new Date(selectedFlight.departureTime).toLocaleString("tr-TR")}
                </div>
                <div>
                  <span className="font-medium">Varış:</span> {new Date(selectedFlight.arrivalTime).toLocaleString("tr-TR")}
                </div>
                <div>
                  <span className="font-medium">Temel Fiyat:</span> ₺{selectedFlight.price}
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
                  Rezervasyonu Kaydet
                </>
              )}
            </button>
            <Link href="/ucak/rezervasyonlar" className="modern-button-secondary">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

