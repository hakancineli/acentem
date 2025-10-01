import { assertModuleEnabled } from "@/lib/moduleGuard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function YeniAracPage() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;

  if (!tenantId) {
    redirect("/login");
  }

  await assertModuleEnabled(tenantId, "arac");

  return (
    <div className="p-6 space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            🚗 Yeni Araç Ekle
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Araç bilgilerini girin ve sisteme ekleyin
          </p>
        </div>
        <Link href="/arac/araclar" className="modern-button-secondary">
          Geri Dön
        </Link>
      </div>

      {/* Form */}
      <div className="modern-card p-6">
        <form action="/api/arac/araclar" method="POST" className="space-y-6">
          {/* Temel Bilgiler */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Temel Bilgiler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Marka *
                </label>
                <input
                  type="text"
                  name="brand"
                  required
                  placeholder="Toyota, Ford, BMW..."
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  required
                  placeholder="Corolla, Focus, X3..."
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Yıl *
                </label>
                <input
                  type="number"
                  name="year"
                  required
                  min="1990"
                  max="2025"
                  placeholder="2023"
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tip *
                </label>
                <select name="type" required className="modern-input">
                  <option value="">Seçiniz</option>
                  <option value="sedan">Sedan</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="SUV">SUV</option>
                  <option value="van">Van</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Yakıt Türü *
                </label>
                <select name="fuel" required className="modern-input">
                  <option value="">Seçiniz</option>
                  <option value="benzin">Benzin</option>
                  <option value="dizel">Dizel</option>
                  <option value="hybrid">Hibrit</option>
                  <option value="elektrik">Elektrik</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Vites *
                </label>
                <select name="transmission" required className="modern-input">
                  <option value="">Seçiniz</option>
                  <option value="manuel">Manuel</option>
                  <option value="otomatik">Otomatik</option>
                </select>
              </div>
            </div>
          </div>

          {/* Teknik Özellikler */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Teknik Özellikler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Koltuk Sayısı *
                </label>
                <input
                  type="number"
                  name="seats"
                  required
                  min="2"
                  max="9"
                  placeholder="5"
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kapı Sayısı *
                </label>
                <input
                  type="number"
                  name="doors"
                  required
                  min="2"
                  max="5"
                  placeholder="4"
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Motor Hacmi
                </label>
                <input
                  type="text"
                  name="engine"
                  placeholder="1.6L, 2.0L..."
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Renk *
                </label>
                <input
                  type="text"
                  name="color"
                  required
                  placeholder="Beyaz, Siyah, Gri..."
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Plaka *
                </label>
                <input
                  type="text"
                  name="plate"
                  required
                  placeholder="34 ABC 123"
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Şasi Numarası
                </label>
                <input
                  type="text"
                  name="vin"
                  placeholder="JT123456789"
                  className="modern-input"
                />
              </div>
            </div>
          </div>

          {/* Fiyatlandırma */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Fiyatlandırma
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Günlük Ücret (TL) *
                </label>
                <input
                  type="number"
                  name="dailyRate"
                  required
                  min="0"
                  step="0.01"
                  placeholder="800.00"
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Haftalık Ücret (TL)
                </label>
                <input
                  type="number"
                  name="weeklyRate"
                  min="0"
                  step="0.01"
                  placeholder="5000.00"
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Aylık Ücret (TL)
                </label>
                <input
                  type="number"
                  name="monthlyRate"
                  min="0"
                  step="0.01"
                  placeholder="18000.00"
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Depozito (TL)
                </label>
                <input
                  type="number"
                  name="deposit"
                  min="0"
                  step="0.01"
                  placeholder="5000.00"
                  className="modern-input"
                />
              </div>
            </div>
          </div>

          {/* Konum ve Açıklama */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Konum ve Açıklama
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Konum *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="İstanbul Havalimanı, Ankara Merkez..."
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Durum *
                </label>
                <select name="status" required className="modern-input">
                  <option value="available">Müsait</option>
                  <option value="maintenance">Bakımda</option>
                  <option value="out_of_service">Servis Dışı</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Araç hakkında detaylı bilgi..."
                  className="modern-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Özellikler
                </label>
                <textarea
                  name="features"
                  rows={3}
                  placeholder="Klima, Navigasyon, Bluetooth, USB, Deri Döşeme..."
                  className="modern-input"
                />
              </div>
            </div>
          </div>

          {/* Form Butonları */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Link href="/arac/araclar" className="modern-button-secondary">
              İptal
            </Link>
            <button type="submit" className="modern-button">
              Araç Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

