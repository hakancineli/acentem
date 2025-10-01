# Acentem CRM - Geliştirici Dokümantasyonu

## 🚀 Proje Genel Bakış

**Acentem CRM**, turizm acenteleri için özel olarak tasarlanmış, modern web teknolojileri kullanılarak geliştirilmiş bir müşteri ilişkileri yönetim sistemidir.

## 🛠️ Teknoloji Stack

### Frontend
- **Next.js 15.5.4** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling framework
- **Turbopack** - Hızlı build sistemi

### Backend
- **Next.js API Routes** - Server-side API
- **Prisma ORM** - Veritabanı yönetimi
- **SQLite** - Development veritabanı
- **PostgreSQL** - Production veritabanı

### Veritabanı
- **Multi-tenant Architecture** - Tenant bazlı veri ayrımı
- **Role-based Access Control** - Rol bazlı yetkilendirme
- **Modular Schema** - Modül bazlı veri yapısı

## 📁 Proje Yapısı

```
acentem/
├── prisma/
│   ├── schema.prisma          # Veritabanı şeması
│   └── seed.ts                # Demo veri
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Authentication pages
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
└── docs/                     # Dokümantasyon
```

## 🗄️ Veritabanı Şeması

### Ana Modeller

#### Tenant (Acente)
```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  users     User[]
  modules   ModuleSetting[]
  // Turizm modülleri
  hotels    Hotel[]
  tours     Tour[]
  transfers Transfer[]
  flights   Flight[]
  healthInsurances HealthInsurance[]
  // Muhasebe modülü
  transactions Transaction[]
}
```

#### User (Kullanıcı)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     // SUPER, ADMIN, AGENT
  tenantId  String?
  tenant    Tenant?  @relation(fields: [tenantId], references: [id])
}
```

#### ModuleSetting (Modül Ayarları)
```prisma
model ModuleSetting {
  id        String   @id @default(cuid())
  tenantId  String
  moduleKey ModuleKey
  enabled   Boolean  @default(false)
}
```

### Turizm Modülleri

#### Otel Modülü
- **Hotel** - Otel bilgileri
- **HotelReservation** - Rezervasyonlar

#### Tur Modülü
- **Tour** - Tur paketleri
- **TourBooking** - Tur rezervasyonları

#### Transfer Modülü
- **Transfer** - Araç bilgileri
- **TransferBooking** - Transfer rezervasyonları

#### Uçak Modülü
- **Flight** - Uçuş bilgileri
- **FlightBooking** - Bilet rezervasyonları

#### Sağlık Modülü
- **HealthInsurance** - Sigorta sağlayıcıları
- **HealthPolicy** - Sigorta poliçeleri

#### Muhasebe Modülü
- **Transaction** - Gelir/gider işlemleri

## 🔧 Geliştirme Süreci

### 1. Modül Geliştirme Adımları

#### A. Veritabanı Şeması
1. `prisma/schema.prisma` dosyasına model ekle
2. `npx prisma generate` çalıştır
3. `npx prisma db push` ile veritabanını güncelle

#### B. API Endpoints
1. `src/app/api/[modul]/` dizininde API routes oluştur
2. CRUD operasyonları için:
   - `GET` - Liste ve detay
   - `POST` - Yeni kayıt
   - `PUT` - Güncelleme
   - `DELETE` - Silme

#### C. Sayfa Bileşenleri
1. `src/app/[modul]/` dizininde sayfalar oluştur
2. Liste sayfası - Arama, filtreleme, sayfalama
3. Form sayfası - Yeni kayıt ekleme
4. Detay sayfası - Kayıt görüntüleme/düzenleme

#### D. Demo Veri
1. `prisma/seed.ts` dosyasına demo veri ekle
2. `npx prisma db seed` ile veriyi yükle

### 2. UI/UX Geliştirme

#### Modern Tasarım Sistemi
```css
/* Modern kartlar */
.modern-card {
  @apply bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700;
}

/* Gradient kartlar */
.modern-card-gradient {
  @apply bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900;
}

/* Modern butonlar */
.modern-button {
  @apply bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl;
}
```

#### Responsive Design
- **Mobile First** yaklaşım
- **Tailwind CSS** breakpoints
- **Flexbox/Grid** layout sistemi

### 3. Güvenlik ve Yetkilendirme

#### Middleware Koruması
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const authToken = cookieStore.get("auth-token")?.value;
  const role = cookieStore.get("role")?.value;
  
  // Public paths kontrolü
  // Role-based access control
  // Tenant isolation
}
```

#### Modül Erişim Kontrolü
```typescript
// src/lib/moduleGuard.ts
export async function assertModuleEnabled(moduleKey: ModuleKey) {
  // Modül aktif mi kontrol et
  // Tenant'a atanmış mı kontrol et
  // Kullanıcı yetkisi var mı kontrol et
}
```

## 📊 Performans Optimizasyonu

### 1. Veritabanı Optimizasyonu
- **Indexing** - Sık kullanılan alanlar için index
- **Pagination** - Sayfalama ile büyük veri setleri
- **Selective Queries** - Sadece gerekli alanları çek

### 2. Frontend Optimizasyonu
- **Server Components** - Server-side rendering
- **Client Components** - Sadece gerekli yerlerde
- **Lazy Loading** - Dinamik import
- **Image Optimization** - Next.js Image component

### 3. Caching Stratejisi
- **Static Generation** - Mümkün olduğunca static
- **ISR** - Incremental Static Regeneration
- **API Caching** - Response caching

## 🧪 Test Stratejisi

### 1. Unit Tests
```bash
npm run test
```

### 2. Integration Tests
```bash
npm run test:integration
```

### 3. E2E Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### 1. Development
```bash
npm run dev
```

### 2. Production Build
```bash
npm run build
npm start
```

### 3. Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Monitoring ve Analytics

### 1. Performance Monitoring
- **Core Web Vitals** - Google PageSpeed
- **Bundle Analysis** - Webpack Bundle Analyzer
- **Database Queries** - Prisma Query Logging

### 2. Error Tracking
- **Console Logging** - Development
- **Error Boundaries** - React error handling
- **API Error Handling** - Centralized error management

## 🔄 CI/CD Pipeline

### 1. GitHub Actions
```yaml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build
```

### 2. Automated Deployment
- **Staging** - Her PR için otomatik deploy
- **Production** - Main branch merge sonrası
- **Database Migrations** - Otomatik schema güncelleme

## 📚 Dokümantasyon

### 1. API Dokümantasyonu
- **Swagger/OpenAPI** - API endpoint dokümantasyonu
- **Postman Collection** - API test koleksiyonu

### 2. Kod Dokümantasyonu
- **JSDoc** - Fonksiyon dokümantasyonu
- **README** - Proje genel bilgileri
- **CHANGELOG** - Versiyon değişiklikleri

## 🐛 Debug ve Troubleshooting

### 1. Yaygın Hatalar

#### Prisma Client Hatası
```bash
# Çözüm
npx prisma generate
npm run dev
```

#### Port Çakışması
```bash
# Çözüm
lsof -ti:3000 | xargs kill -9
npm run dev
```

#### Veritabanı Sync Hatası
```bash
# Çözüm
npx prisma db push --force-reset
npx prisma db seed
```

### 2. Debug Araçları
- **Prisma Studio** - Veritabanı görüntüleme
- **Next.js DevTools** - Performance analizi
- **React DevTools** - Component debugging

## 📋 Geliştirme Checklist

### Yeni Modül Ekleme
- [ ] Veritabanı şeması güncellendi
- [ ] API endpoints oluşturuldu
- [ ] Sayfa bileşenleri eklendi
- [ ] Demo veri eklendi
- [ ] Test yazıldı
- [ ] Dokümantasyon güncellendi

### Bug Fix
- [ ] Hata reproduce edildi
- [ ] Root cause bulundu
- [ ] Fix uygulandı
- [ ] Test edildi
- [ ] Dokümantasyon güncellendi

### Feature Request
- [ ] Gereksinim analizi yapıldı
- [ ] Teknik tasarım oluşturuldu
- [ ] Implementation tamamlandı
- [ ] Test yazıldı
- [ ] Dokümantasyon güncellendi

---

## 📞 İletişim ve Destek

**Geliştirici Ekibi**
- **Lead Developer:** [İsim]
- **Email:** dev@acentem.com
- **GitHub:** https://github.com/acentem
- **Slack:** #acentem-dev

**Teknik Destek**
- **Documentation:** https://docs.acentem.com
- **API Reference:** https://api.acentem.com/docs
- **Status Page:** https://status.acentem.com

---

*Son güncelleme: Aralık 2024*
*Versiyon: 1.0.0*
*Build: Next.js 15.5.4*

