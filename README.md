# 🏢 Acentem CRM

**Modern Turizm Acenteleri için Kapsamlı CRM Sistemi**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)](https://tailwindcss.com/)

## 🎯 Özellikler

### 🏨 **Otel Modülü**
- Otel yönetimi ve rezervasyon sistemi
- Gerçek zamanlı müsaitlik takibi
- Misafir bilgileri ve özel istekler
- Otel olanakları ve yıldız derecelendirmesi

### 🗺️ **Tur Modülü**
- Tur paketi oluşturma ve yönetimi
- Tur rezervasyon sistemi
- Destinasyon ve süre yönetimi
- Katılımcı takibi

### 🚗 **Transfer Modülü**
- Araç filosu yönetimi
- Transfer rezervasyon sistemi
- Araç tipi ve kapasite yönetimi
- Mesafe bazlı fiyatlandırma

### ✈️ **Uçak Modülü**
- Uçuş bilgileri yönetimi
- Bilet rezervasyon sistemi
- Havayolu ve sınıf yönetimi
- Dinamik fiyat hesaplama

### ❤️ **Sağlık Modülü**
- Sigorta sağlayıcı yönetimi
- Poliçe oluşturma ve takibi
- Kapsam ve prim yönetimi
- Otomatik prim hesaplama

### 📊 **Muhasebe Modülü**
- Gelir/gider takibi
- Kategori bazlı finansal analiz
- Raporlama ve export
- Bütçe yönetimi

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18.0.0+
- NPM 8.0.0+
- SQLite (development) / PostgreSQL (production)

### Kurulum

1. **Projeyi klonlayın**
```bash
git clone https://github.com/acentem/acentem-crm.git
cd acentem-crm
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Ortam değişkenlerini ayarlayın**
```bash
cp .env.example .env.local
```

4. **Veritabanını hazırlayın**
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

Sistem `http://localhost:3000` adresinde çalışmaya başlayacaktır.

## 🔐 Varsayılan Giriş Bilgileri

### Super User
- **Email:** `super@acentem.com`
- **Şifre:** `super123`

### Admin User
- **Email:** `admin@acentem.com`
- **Şifre:** `admin123`

### Agent User
- **Email:** `agent@acentem.com`
- **Şifre:** `agent123`

## 🏗️ Teknoloji Stack

### Frontend
- **Next.js 15.5.4** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Modern styling
- **Turbopack** - Hızlı build sistemi

### Backend
- **Next.js API Routes** - Server-side API
- **Prisma ORM** - Veritabanı yönetimi
- **SQLite** - Development veritabanı
- **PostgreSQL** - Production veritabanı

### Özellikler
- **Multi-tenant Architecture** - Çoklu acente desteği
- **Role-based Access Control** - Rol bazlı yetkilendirme
- **Responsive Design** - Mobil uyumlu
- **Dark Mode** - Koyu tema desteği
- **Real-time Updates** - Gerçek zamanlı güncellemeler

## 📁 Proje Yapısı

```
acentem/
├── prisma/
│   ├── schema.prisma          # Veritabanı şeması
│   └── seed.ts                # Demo veri
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Authentication
│   │   ├── admin/            # Admin paneli
│   │   ├── super/            # Super user paneli
│   │   ├── otel/             # Otel modülü
│   │   ├── tur/              # Tur modülü
│   │   ├── transfer/         # Transfer modülü
│   │   ├── ucak/             # Uçak modülü
│   │   ├── saglik/           # Sağlık modülü
│   │   ├── muhasebe/         # Muhasebe modülü
│   │   └── api/              # API endpoints
│   ├── components/           # React bileşenleri
│   ├── lib/                  # Utility fonksiyonları
│   └── generated/            # Prisma client
├── public/                   # Static dosyalar
├── docs/                     # Dokümantasyon
└── README.md                 # Bu dosya
```

## 🎨 UI/UX Özellikleri

### Modern Tasarım
- **Gradient kartlar** ve hover efektleri
- **Responsive grid** layout sistemi
- **Dark/Light mode** desteği
- **Smooth animations** ve transitions

### Kullanıcı Deneyimi
- **Intuitive navigation** - Sezgisel menü sistemi
- **Quick actions** - Hızlı işlem butonları
- **Search & filter** - Gelişmiş arama ve filtreleme
- **Real-time feedback** - Anlık geri bildirimler

## 📊 Dashboard ve Raporlama

### Ana Dashboard
- **KPI kartları** - Önemli metrikler
- **Grafikler** - Trend analizi
- **Son aktiviteler** - Gerçek zamanlı güncellemeler
- **Hızlı erişim** - Modül linkleri

### Modül Raporları
- **Liste görünümleri** - Arama, filtreleme, sayfalama
- **CSV export** - Veri dışa aktarma
- **İstatistikler** - Modül bazlı KPI'lar
- **Filtreleme** - Tarih, kategori, durum bazlı

## 🔧 Geliştirme

### Geliştirme Komutları
```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Production start
npm start

# Veritabanı işlemleri
npx prisma generate
npx prisma db push
npx prisma db seed

# Test
npm run test
```

### Veritabanı Yönetimi
```bash
# Prisma Studio (Veritabanı görüntüleme)
npx prisma studio

# Migration oluşturma
npx prisma migrate dev --name migration_name

# Veritabanı sıfırlama
npx prisma migrate reset
```

## 📚 Dokümantasyon

- **[Kullanma Kılavuzu](./KULLANMA_KILAVUZU.md)** - Kullanıcı dokümantasyonu
- **[Geliştirici Dokümantasyonu](./GELISTIRICI_DOKUMANTASYONU.md)** - Teknik dokümantasyon
- **[API Dokümantasyonu](./API_DOKUMANTASYONU.md)** - API referansı

## 🧪 Test

### Test Komutları
```bash
# Unit testler
npm run test

# Integration testler
npm run test:integration

# E2E testler
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 🚀 Deployment

### Docker ile Deployment
```bash
# Docker image oluştur
docker build -t acentem-crm .

# Container çalıştır
docker run -p 3000:3000 acentem-crm
```

### Production Build
```bash
# Build oluştur
npm run build

# Production start
npm start
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/acentem"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# API
API_BASE_URL="https://api.yourdomain.com"
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

**Acentem CRM** - Turizm Acenteleri için CRM Sistemi

- **Website:** https://acentem.com
- **Email:** info@acentem.com
- **GitHub:** https://github.com/acentem
- **Documentation:** https://docs.acentem.com

## 🙏 Teşekkürler

- **Next.js** - React framework
- **Prisma** - Database toolkit
- **Tailwind CSS** - CSS framework
- **Vercel** - Deployment platform

---

**Acentem CRM** - Modern turizm acenteleri için kapsamlı çözüm 🚀

*Son güncelleme: Aralık 2024*
*Versiyon: 1.0.0*