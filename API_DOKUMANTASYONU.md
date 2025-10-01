# Acentem CRM - API Dokümantasyonu

## 🌐 API Genel Bakış

**Acentem CRM API**, RESTful mimaride tasarlanmış, JSON formatında veri alışverişi yapan modern bir API'dir.

### Base URL
```
Development: http://localhost:3000/api
Production: https://api.acentem.com
```

### Authentication
Tüm API istekleri `auth-token` cookie'si ile kimlik doğrulaması gerektirir.

### Response Format
```json
{
  "data": {}, // Başarılı response data
  "error": "Error message", // Hata mesajı
  "pagination": { // Sayfalama bilgisi
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## 🔐 Authentication API

### POST /api/auth/login
Kullanıcı girişi yapar.

**Request Body:**
```json
{
  "email": "admin@acentem.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "admin@acentem.com",
    "role": "ADMIN",
    "tenantId": "tenant_id"
  },
  "token": "auth_token"
}
```

### POST /api/auth/logout
Kullanıcı çıkışı yapar.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🏢 Tenant API

### GET /api/tenants
Tüm tenant'ları listeler.

**Response:**
```json
{
  "tenants": [
    {
      "id": "tenant_id",
      "name": "Demo Acente",
      "modules": {
        "otel": true,
        "tur": true,
        "transfer": false
      }
    }
  ]
}
```

### POST /api/tenants
Yeni tenant oluşturur.

**Request Body:**
```json
{
  "name": "Yeni Acente",
  "modules": {
    "otel": true,
    "tur": true,
    "transfer": true,
    "ucak": false,
    "saglik": false,
    "muhasebe": true
  }
}
```

---

## 🏨 Otel Modülü API

### GET /api/otel/oteller
Otel listesini getirir.

**Query Parameters:**
- `page` - Sayfa numarası (default: 1)
- `limit` - Sayfa başına kayıt (default: 10)
- `q` - Arama terimi
- `sort` - Sıralama alanı
- `dir` - Sıralama yönü (asc/desc)

**Response:**
```json
{
  "hotels": [
    {
      "id": "hotel_id",
      "name": "Grand Hotel Resort",
      "location": "Antalya",
      "starRating": 5,
      "amenities": "[\"WiFi\", \"Havuz\", \"Spa\"]",
      "isActive": true,
      "_count": {
        "reservations": 15
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### POST /api/otel/oteller
Yeni otel oluşturur.

**Request Body:**
```json
{
  "name": "Yeni Otel",
  "location": "İstanbul",
  "starRating": 4,
  "amenities": "[\"WiFi\", \"Restoran\"]",
  "isActive": true
}
```

### GET /api/otel/oteller/[id]
Belirli oteli getirir.

### PUT /api/otel/oteller/[id]
Otel bilgilerini günceller.

### DELETE /api/otel/oteller/[id]
Otel siler.

### GET /api/otel/rezervasyonlar
Otel rezervasyonlarını listeler.

### POST /api/otel/rezervasyonlar
Yeni rezervasyon oluşturur.

**Request Body:**
```json
{
  "hotelId": "hotel_id",
  "guestName": "Ahmet Yılmaz",
  "guestEmail": "ahmet@example.com",
  "checkIn": "2024-12-01",
  "checkOut": "2024-12-04",
  "rooms": 2,
  "adults": 4,
  "children": 1,
  "totalPrice": 25000,
  "status": "pending",
  "notes": "Deniz manzaralı oda"
}
```

---

## 🗺️ Tur Modülü API

### GET /api/tur/turlar
Tur listesini getirir.

### POST /api/tur/turlar
Yeni tur oluşturur.

**Request Body:**
```json
{
  "name": "Kapadokya Turu",
  "destination": "Nevşehir",
  "duration": 2,
  "price": 8500,
  "description": "2 günlük Kapadokya turu",
  "isActive": true
}
```

### GET /api/tur/rezervasyonlar
Tur rezervasyonlarını listeler.

### POST /api/tur/rezervasyonlar
Yeni tur rezervasyonu oluşturur.

**Request Body:**
```json
{
  "tourId": "tour_id",
  "customerName": "Fatma Demir",
  "customerEmail": "fatma@example.com",
  "startDate": "2024-12-15",
  "participants": 2,
  "totalPrice": 8500,
  "status": "pending",
  "notes": "Balayı çifti"
}
```

---

## 🚗 Transfer Modülü API

### GET /api/transfer/araclar
Araç listesini getirir.

### POST /api/transfer/araclar
Yeni araç oluşturur.

**Request Body:**
```json
{
  "vehicleType": "sedan",
  "capacity": 4,
  "pricePerKm": 5,
  "isActive": true
}
```

### GET /api/transfer/rezervasyonlar
Transfer rezervasyonlarını listeler.

### POST /api/transfer/rezervasyonlar
Yeni transfer rezervasyonu oluşturur.

**Request Body:**
```json
{
  "transferId": "transfer_id",
  "customerName": "Mehmet Kaya",
  "customerPhone": "05551234567",
  "pickupLocation": "Havalimanı",
  "dropoffLocation": "Otel",
  "pickupDate": "2024-12-01T10:00:00Z",
  "distance": 25,
  "totalPrice": 125,
  "status": "pending"
}
```

---

## ✈️ Uçak Modülü API

### GET /api/ucak/ucuslar
Uçuş listesini getirir.

### POST /api/ucak/ucuslar
Yeni uçuş oluşturur.

**Request Body:**
```json
{
  "airline": "Turkish Airlines",
  "flightNumber": "TK1234",
  "departure": "İstanbul (IST)",
  "arrival": "Antalya (AYT)",
  "departureTime": "2024-12-01T08:00:00Z",
  "arrivalTime": "2024-12-01T10:00:00Z",
  "price": 800,
  "isActive": true
}
```

### GET /api/ucak/rezervasyonlar
Uçak rezervasyonlarını listeler.

### POST /api/ucak/rezervasyonlar
Yeni uçak rezervasyonu oluşturur.

**Request Body:**
```json
{
  "flightId": "flight_id",
  "passengerName": "Zeynep Ak",
  "passengerEmail": "zeynep@example.com",
  "seatClass": "economy",
  "totalPrice": 800,
  "status": "pending"
}
```

---

## ❤️ Sağlık Modülü API

### GET /api/saglik/sigortalar
Sigorta listesini getirir.

### POST /api/saglik/sigortalar
Yeni sigorta oluşturur.

**Request Body:**
```json
{
  "provider": "Allianz",
  "planName": "Seyahat Sağlık Sigortası",
  "coverage": "Avrupa kapsamında acil tıbbi müdahale",
  "price": 150,
  "isActive": true
}
```

### GET /api/saglik/policeler
Poliçe listesini getirir.

### POST /api/saglik/policeler
Yeni poliçe oluşturur.

**Request Body:**
```json
{
  "insuranceId": "insurance_id",
  "policyNumber": "POL123456",
  "holderName": "Can Yılmaz",
  "holderEmail": "can@example.com",
  "startDate": "2024-12-01",
  "endDate": "2024-12-31",
  "premium": 150,
  "status": "active"
}
```

---

## 📊 Muhasebe Modülü API

### GET /api/muhasebe/gelirler
Gelir listesini getirir.

**Query Parameters:**
- `category` - Kategori filtresi (otel, tur, transfer, ucak, saglik, diger)
- `dateFrom` - Başlangıç tarihi
- `dateTo` - Bitiş tarihi

### POST /api/muhasebe/gelirler
Yeni gelir oluşturur.

**Request Body:**
```json
{
  "category": "otel",
  "amount": 25000,
  "description": "Antalya Grand Hotel rezervasyon geliri",
  "source": "Ahmet Yılmaz",
  "reference": "REZ-001",
  "date": "2024-12-01",
  "status": "completed",
  "notes": "3 gecelik rezervasyon"
}
```

### GET /api/muhasebe/giderler
Gider listesini getirir.

### POST /api/muhasebe/giderler
Yeni gider oluşturur.

**Request Body:**
```json
{
  "category": "ofis",
  "amount": 5000,
  "description": "Ofis kira ödemesi",
  "source": "Ev Sahibi",
  "reference": "KIRA-001",
  "date": "2024-12-01",
  "status": "completed",
  "notes": "Aralık ayı kira"
}
```

---

## 📈 Raporlama API

### GET /api/reports/dashboard
Dashboard istatistiklerini getirir.

**Response:**
```json
{
  "stats": {
    "totalHotels": 15,
    "totalReservations": 150,
    "totalRevenue": 250000,
    "pendingReservations": 25
  },
  "recentActivity": [
    {
      "type": "reservation",
      "description": "Yeni otel rezervasyonu",
      "amount": 25000,
      "date": "2024-12-01"
    }
  ]
}
```

### GET /api/reports/export/[module]
Modül verilerini CSV formatında export eder.

**Query Parameters:**
- `format` - Export formatı (csv, xlsx)
- `dateFrom` - Başlangıç tarihi
- `dateTo` - Bitiş tarihi

---

## 🔧 Hata Kodları

### HTTP Status Codes
- `200` - Başarılı
- `201` - Oluşturuldu
- `400` - Hatalı istek
- `401` - Yetkisiz erişim
- `403` - Yasaklı
- `404` - Bulunamadı
- `500` - Sunucu hatası

### Hata Response Formatı
```json
{
  "error": "Hata mesajı",
  "code": "ERROR_CODE",
  "details": {
    "field": "Hangi alanda hata var",
    "message": "Detaylı hata açıklaması"
  }
}
```

### Yaygın Hata Kodları
- `TENANT_NOT_FOUND` - Tenant bulunamadı
- `MODULE_DISABLED` - Modül devre dışı
- `UNAUTHORIZED` - Yetkisiz erişim
- `VALIDATION_ERROR` - Doğrulama hatası
- `DUPLICATE_ENTRY` - Tekrarlanan kayıt

---

## 🧪 API Test Örnekleri

### cURL Örnekleri

#### Otel Listesi Getir
```bash
curl -X GET "http://localhost:3000/api/otel/oteller?page=1&limit=10" \
  -H "Cookie: auth-token=your_token"
```

#### Yeni Otel Oluştur
```bash
curl -X POST "http://localhost:3000/api/otel/oteller" \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=your_token" \
  -d '{
    "name": "Test Otel",
    "location": "İstanbul",
    "starRating": 4,
    "amenities": "[\"WiFi\", \"Havuz\"]",
    "isActive": true
  }'
```

#### Rezervasyon Oluştur
```bash
curl -X POST "http://localhost:3000/api/otel/rezervasyonlar" \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=your_token" \
  -d '{
    "hotelId": "hotel_id",
    "guestName": "Test Müşteri",
    "guestEmail": "test@example.com",
    "checkIn": "2024-12-01",
    "checkOut": "2024-12-04",
    "rooms": 1,
    "adults": 2,
    "children": 0,
    "totalPrice": 15000,
    "status": "pending"
  }'
```

### JavaScript Örnekleri

#### Fetch API ile Veri Getir
```javascript
const response = await fetch('/api/otel/oteller?page=1&limit=10', {
  method: 'GET',
  headers: {
    'Cookie': 'auth-token=your_token'
  }
});
const data = await response.json();
```

#### Axios ile POST İsteği
```javascript
import axios from 'axios';

const response = await axios.post('/api/otel/oteller', {
  name: 'Test Otel',
  location: 'İstanbul',
  starRating: 4,
  amenities: '["WiFi", "Havuz"]',
  isActive: true
}, {
  headers: {
    'Cookie': 'auth-token=your_token'
  }
});
```

---

## 📚 SDK ve Kütüphaneler

### JavaScript/TypeScript SDK
```bash
npm install @acentem/api-client
```

```typescript
import { AcentemClient } from '@acentem/api-client';

const client = new AcentemClient({
  baseUrl: 'http://localhost:3000/api',
  authToken: 'your_token'
});

// Otel listesi
const hotels = await client.hotels.list({ page: 1, limit: 10 });

// Yeni otel oluştur
const hotel = await client.hotels.create({
  name: 'Test Otel',
  location: 'İstanbul',
  starRating: 4
});
```

### Python SDK
```bash
pip install acentem-api
```

```python
from acentem import AcentemClient

client = AcentemClient(
    base_url='http://localhost:3000/api',
    auth_token='your_token'
)

# Otel listesi
hotels = client.hotels.list(page=1, limit=10)

# Yeni otel oluştur
hotel = client.hotels.create({
    'name': 'Test Otel',
    'location': 'İstanbul',
    'star_rating': 4
})
```

---

## 🔄 Rate Limiting

### Limitler
- **Authenticated Users:** 1000 istek/saat
- **Unauthenticated:** 100 istek/saat
- **Burst Limit:** 50 istek/dakika

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limit Aşımı
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 3600
}
```

---

## 📊 API Monitoring

### Health Check
```bash
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-01T10:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "services": {
    "auth": "healthy",
    "database": "healthy",
    "cache": "healthy"
  }
}
```

### Metrics Endpoint
```bash
GET /api/metrics
```

**Response:**
```json
{
  "requests": {
    "total": 10000,
    "successful": 9500,
    "failed": 500
  },
  "response_time": {
    "average": 150,
    "p95": 300,
    "p99": 500
  }
}
```

---

## 📞 Destek ve İletişim

**API Dokümantasyonu**
- **Swagger UI:** https://api.acentem.com/docs
- **Postman Collection:** https://api.acentem.com/postman
- **GitHub:** https://github.com/acentem/api

**Teknik Destek**
- **Email:** api-support@acentem.com
- **Slack:** #acentem-api
- **Status Page:** https://status.acentem.com

---

*Son güncelleme: Aralık 2024*
*API Versiyon: v1.0.0*
*Base URL: http://localhost:3000/api*

