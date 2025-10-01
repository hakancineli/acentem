# Acentem CRM - Kullanma Kılavuzu

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Sistem Gereksinimleri](#sistem-gereksinimleri)
3. [Kurulum](#kurulum)
4. [İlk Giriş](#ilk-giriş)
5. [Modül Yönetimi](#modül-yönetimi)
6. [Otel Modülü](#otel-modülü)
7. [Tur Modülü](#tur-modülü)
8. [Transfer Modülü](#transfer-modülü)
9. [Uçak Modülü](#uçak-modülü)
10. [Sağlık Modülü](#sağlık-modülü)
11. [Muhasebe Modülü](#muhasebe-modülü)
12. [Kullanıcı Yönetimi](#kullanıcı-yönetimi)
13. [Raporlama](#raporlama)
14. [Sorun Giderme](#sorun-giderme)

---

## 🎯 Genel Bakış

**Acentem CRM**, turizm acenteleri için özel olarak tasarlanmış, modüler yapıda bir müşteri ilişkileri yönetim sistemidir. Sistem, multi-tenant mimarisi ile birden fazla acente tarafından kullanılabilir.

### ✨ Temel Özellikler
- **Multi-tenant yapı** - Her acente kendi verilerini yönetir
- **Modüler sistem** - İhtiyaca göre modüller aktif/pasif edilebilir
- **Rol bazlı erişim** - Super, Admin, Agent rolleri
- **Modern arayüz** - Responsive ve kullanıcı dostu tasarım
- **Gerçek zamanlı veri** - Anlık güncellemeler

### 🏢 Desteklenen Modüller
1. **Otel Modülü** - Otel rezervasyon yönetimi
2. **Tur Modülü** - Tur paketi ve rezervasyon yönetimi
3. **Transfer Modülü** - Araç ve transfer hizmetleri
4. **Uçak Modülü** - Uçuş ve bilet rezervasyonları
5. **Sağlık Modülü** - Sigorta ve poliçe yönetimi
6. **Muhasebe Modülü** - Gelir/gider finansal yönetimi

---

## 💻 Sistem Gereksinimleri

### Minimum Gereksinimler
- **Node.js:** 18.0.0 veya üzeri
- **NPM:** 8.0.0 veya üzeri
- **Veritabanı:** SQLite (geliştirme), PostgreSQL (üretim)
- **RAM:** 4GB minimum
- **Disk:** 2GB boş alan

### Tarayıcı Desteği
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🚀 Kurulum

### 1. Projeyi İndirin
```bash
git clone [repository-url]
cd acentem
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın
`.env.local` dosyası oluşturun:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Veritabanını Hazırlayın
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

Sistem `http://localhost:3000` adresinde çalışmaya başlayacaktır.

---

## 🔐 İlk Giriş

### Varsayılan Kullanıcı Bilgileri
Sistem ilk kurulumda aşağıdaki kullanıcıları oluşturur:

**Super User:**
- Email: `super@acentem.com`
- Şifre: `super123`

**Admin User:**
- Email: `admin@acentem.com`
- Şifre: `admin123`

**Agent User:**
- Email: `agent@acentem.com`
- Şifre: `agent123`

### İlk Giriş Adımları
1. `http://localhost:3000` adresine gidin
2. Login sayfasında email ve şifre girin
3. Dashboard'a yönlendirileceksiniz
4. İlk olarak tenant seçimi yapın

---

## ⚙️ Modül Yönetimi

### Modül Aktif/Pasif Etme
1. **Admin** veya **Super** kullanıcı olarak giriş yapın
2. Sol menüden **"Admin"** bölümüne gidin
3. **"Modül Ayarları"** sekmesini seçin
4. İstediğiniz modülleri aktif/pasif edin
5. Değişiklikleri kaydedin

### Modül İzinleri
- **Super User:** Tüm modüllere erişim
- **Admin:** Tenant'a atanmış modüllere erişim
- **Agent:** Admin tarafından verilen izinlere göre erişim

---

## 🏨 Otel Modülü

### Otel Ekleme
1. **Otel** modülüne gidin
2. **"Oteller"** sekmesini seçin
3. **"Yeni Otel"** butonuna tıklayın
4. Otel bilgilerini doldurun:
   - Otel adı
   - Konum
   - Yıldız sayısı
   - Olanaklar
5. **"Kaydet"** butonuna tıklayın

### Rezervasyon Oluşturma
1. **"Rezervasyonlar"** sekmesine gidin
2. **"Yeni Rezervasyon"** butonuna tıklayın
3. Rezervasyon bilgilerini doldurun:
   - Otel seçimi
   - Misafir bilgileri
   - Giriş/Çıkış tarihleri
   - Oda sayısı ve misafir sayısı
4. **"Kaydet"** butonuna tıklayın

### Rezervasyon Durumları
- **Beklemede:** Onay bekleyen rezervasyonlar
- **Onaylandı:** Onaylanmış rezervasyonlar
- **İptal:** İptal edilmiş rezervasyonlar

---

## 🗺️ Tur Modülü

### Tur Paketi Oluşturma
1. **Tur** modülüne gidin
2. **"Turlar"** sekmesini seçin
3. **"Yeni Tur"** butonuna tıklayın
4. Tur bilgilerini doldurun:
   - Tur adı
   - Destinasyon
   - Süre (gün)
   - Fiyat
   - Açıklama
5. **"Kaydet"** butonuna tıklayın

### Tur Rezervasyonu
1. **"Rezervasyonlar"** sekmesine gidin
2. **"Yeni Rezervasyon"** butonuna tıklayın
3. Rezervasyon bilgilerini doldurun:
   - Tur seçimi
   - Müşteri bilgileri
   - Başlangıç tarihi
   - Katılımcı sayısı
4. **"Kaydet"** butonuna tıklayın

---

## 🚗 Transfer Modülü

### Araç Ekleme
1. **Transfer** modülüne gidin
2. **"Araçlar"** sekmesini seçin
3. **"Yeni Araç"** butonuna tıklayın
4. Araç bilgilerini doldurun:
   - Araç tipi (Sedan, Minivan, Otobüs)
   - Kapasite
   - Km başına fiyat
5. **"Kaydet"** butonuna tıklayın

### Transfer Rezervasyonu
1. **"Rezervasyonlar"** sekmesine gidin
2. **"Yeni Rezervasyon"** butonuna tıklayın
3. Rezervasyon bilgilerini doldurun:
   - Araç seçimi
   - Müşteri bilgileri
   - Alış/Veriş lokasyonları
   - Tarih ve saat
4. **"Kaydet"** butonuna tıklayın

---

## ✈️ Uçak Modülü

### Uçuş Ekleme
1. **Uçak** modülüne gidin
2. **"Uçuşlar"** sekmesini seçin
3. **"Yeni Uçuş"** butonuna tıklayın
4. Uçuş bilgilerini doldurun:
   - Havayolu
   - Uçuş numarası
   - Kalkış/Varış havalimanları
   - Kalkış/Varış saatleri
   - Fiyat
5. **"Kaydet"** butonuna tıklayın

### Bilet Rezervasyonu
1. **"Rezervasyonlar"** sekmesine gidin
2. **"Yeni Rezervasyon"** butonuna tıklayın
3. Rezervasyon bilgilerini doldurun:
   - Uçuş seçimi
   - Yolcu bilgileri
   - Sınıf seçimi (Economy, Business, First)
   - Fiyat otomatik hesaplanır
4. **"Kaydet"** butonuna tıklayın

---

## ❤️ Sağlık Modülü

### Sigorta Ekleme
1. **Sağlık** modülüne gidin
2. **"Sigortalar"** sekmesini seçin
3. **"Yeni Sigorta"** butonuna tıklayın
4. Sigorta bilgilerini doldurun:
   - Sağlayıcı (Allianz, Axa, vb.)
   - Plan adı
   - Kapsam detayları
   - Yıllık prim
5. **"Kaydet"** butonuna tıklayın

### Poliçe Oluşturma
1. **"Poliçeler"** sekmesine gidin
2. **"Yeni Poliçe"** butonuna tıklayın
3. Poliçe bilgilerini doldurun:
   - Sigorta seçimi
   - Poliçe numarası (otomatik oluşturulabilir)
   - Sigortalı bilgileri
   - Başlangıç/Bitiş tarihleri
   - Prim otomatik hesaplanır
4. **"Kaydet"** butonuna tıklayın

---

## 📊 Muhasebe Modülü

### Gelir Ekleme
1. **Muhasebe** modülüne gidin
2. **"Gelirler"** sekmesini seçin
3. **"Yeni Gelir"** butonuna tıklayın
4. Gelir bilgilerini doldurun:
   - Kategori (Otel, Tur, Transfer, Uçak, Sağlık)
   - Tutar
   - Açıklama
   - Kaynak (Müşteri, Banka, vb.)
   - Referans (Fatura no, Rezervasyon no)
   - Tarih
5. **"Kaydet"** butonuna tıklayın

### Gider Ekleme
1. **"Giderler"** sekmesine gidin
2. **"Yeni Gider"** butonuna tıklayın
3. Gider bilgilerini doldurun:
   - Kategori (Otel, Tur, Transfer, Uçak, Sağlık, Ofis, Pazarlama)
   - Tutar
   - Açıklama
   - Kaynak (Tedarikçi, Banka, vb.)
   - Referans (Fatura no, Sözleşme no)
   - Tarih
4. **"Kaydet"** butonuna tıklayın

---

## 👥 Kullanıcı Yönetimi

### Yeni Kullanıcı Ekleme
1. **Admin** veya **Super** kullanıcı olarak giriş yapın
2. Sol menüden **"Kullanıcılar"** bölümüne gidin
3. **"Yeni Kullanıcı"** butonuna tıklayın
4. Kullanıcı bilgilerini doldurun:
   - Email
   - Şifre
   - Rol (Admin, Agent)
   - Tenant seçimi
5. **"Kaydet"** butonuna tıklayın

### Rol Yetkileri
- **Super:** Tüm sistem yönetimi
- **Admin:** Tenant yönetimi ve modül kontrolü
- **Agent:** Atanan modüllerde işlem yapma

---

## 📈 Raporlama

### Dashboard
- **Ana sayfa** tüm modüllerden özet bilgileri gösterir
- **KPI kartları** ile hızlı istatistikler
- **Son işlemler** listesi
- **Grafikler** ile trend analizi

### Modül Raporları
Her modülde kendi raporları bulunur:
- **Liste görünümleri** - Arama, filtreleme, sayfalama
- **CSV export** - Veri dışa aktarma
- **İstatistikler** - Modül bazlı KPI'lar

---

## 🔧 Sorun Giderme

### Yaygın Sorunlar

#### 1. "Module not enabled" Hatası
**Çözüm:** Admin panelinden modülü aktif edin

#### 2. Veritabanı Bağlantı Hatası
**Çözüm:** 
```bash
npx prisma generate
npx prisma db push
```

#### 3. Port Çakışması
**Çözüm:**
```bash
# Port 3000'i kullanan processleri sonlandır
lsof -ti:3000 | xargs kill -9
npm run dev
```

#### 4. Prisma Client Hatası
**Çözüm:**
```bash
npx prisma generate
npm run dev
```

### Log Dosyaları
- **Console:** Tarayıcı geliştirici araçları
- **Terminal:** Development server çıktıları
- **Database:** SQLite veritabanı logları

### Destek
- **Dokümantasyon:** Bu kılavuz
- **GitHub Issues:** Teknik sorunlar için
- **Email:** admin@acentem.com

---

## 📞 İletişim

**Acentem CRM** - Turizm Acenteleri için CRM Sistemi

- **Website:** https://acentem.com
- **Email:** info@acentem.com
- **Support:** support@acentem.com
- **Documentation:** https://docs.acentem.com

---

*Son güncelleme: Aralık 2024*
*Versiyon: 1.0.0*

