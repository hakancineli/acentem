# Acentem CRM - Security Guide

## 🔒 Güvenlik Rehberi

### 1. Authentication & Authorization

#### Password Security
```typescript
// src/lib/auth.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Password strength validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermelidir');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermelidir');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Şifre en az bir rakam içermelidir');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Şifre en az bir özel karakter içermelidir');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

#### Session Management
```typescript
// src/lib/session.ts
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function createSession(userId: string, tenantId: string, role: string) {
  const token = await new SignJWT({ userId, tenantId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
    
  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}
```

### 2. Input Validation & Sanitization

#### Zod Schema Validation
```typescript
// src/lib/validations.ts
import { z } from 'zod';

export const hotelSchema = z.object({
  name: z.string().min(1, 'Otel adı gereklidir').max(100, 'Otel adı çok uzun'),
  location: z.string().min(1, 'Konum gereklidir').max(100, 'Konum çok uzun'),
  starRating: z.number().int().min(1, 'Yıldız sayısı en az 1 olmalıdır').max(5, 'Yıldız sayısı en fazla 5 olabilir'),
  amenities: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const reservationSchema = z.object({
  hotelId: z.string().cuid('Geçersiz otel ID'),
  guestName: z.string().min(1, 'Misafir adı gereklidir').max(100, 'Misafir adı çok uzun'),
  guestEmail: z.string().email('Geçerli email adresi giriniz'),
  checkIn: z.string().datetime('Geçerli tarih formatı giriniz'),
  checkOut: z.string().datetime('Geçerli tarih formatı giriniz'),
  rooms: z.number().int().min(1, 'Oda sayısı en az 1 olmalıdır').max(10, 'Oda sayısı en fazla 10 olabilir'),
  adults: z.number().int().min(1, 'Yetişkin sayısı en az 1 olmalıdır').max(20, 'Yetişkin sayısı çok fazla'),
  children: z.number().int().min(0, 'Çocuk sayısı negatif olamaz').max(10, 'Çocuk sayısı çok fazla'),
  totalPrice: z.number().int().min(0, 'Fiyat negatif olamaz'),
  status: z.enum(['pending', 'confirmed', 'cancelled']).default('pending'),
  notes: z.string().max(500, 'Notlar çok uzun').optional()
});
```

#### SQL Injection Prevention
```typescript
// src/lib/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Always use Prisma's built-in parameterized queries
export async function getHotelsByTenant(tenantId: string, searchTerm?: string) {
  return await prisma.hotel.findMany({
    where: {
      tenantId,
      ...(searchTerm && {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { location: { contains: searchTerm, mode: 'insensitive' } }
        ]
      })
    }
  });
}
```

### 3. Rate Limiting

#### API Rate Limiting
```typescript
// src/lib/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, limit: number = 100, windowMs: number = 15 * 60 * 1000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const userLimit = rateLimitMap.get(identifier);
  
  if (!userLimit || userLimit.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  
  if (userLimit.count >= limit) {
    return { success: false, remaining: 0 };
  }
  
  userLimit.count++;
  return { success: true, remaining: limit - userLimit.count };
}

export function withRateLimit(handler: Function, limit: number = 100) {
  return async (req: NextRequest, ...args: any[]) => {
    const identifier = req.ip || 'unknown';
    const rateLimitResult = rateLimit(identifier, limit);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 15 * 60 * 1000).toISOString()
          }
        }
      );
    }
    
    const response = await handler(req, ...args);
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    return response;
  };
}
```

### 4. CORS Configuration

#### CORS Middleware
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'http://localhost:3000');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  
  return response;
}
```

### 5. Data Encryption

#### Sensitive Data Encryption
```typescript
// src/lib/encryption.ts
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);

export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, secretKey);
  cipher.setAAD(Buffer.from('acentem-crm', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipher(algorithm, secretKey);
  decipher.setAAD(Buffer.from('acentem-crm', 'utf8'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 6. Audit Logging

#### Security Event Logging
```typescript
// src/lib/audit.ts
import { prisma } from '@/lib/prisma';

export enum AuditEvent {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFY = 'DATA_MODIFY',
  DATA_DELETE = 'DATA_DELETE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE'
}

export async function logAuditEvent(
  userId: string,
  event: AuditEvent,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        event,
        details: JSON.stringify(details),
        ipAddress,
        userAgent,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}
```

### 7. File Upload Security

#### Secure File Upload
```typescript
// src/lib/fileUpload.ts
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadFile(file: File, tenantId: string): Promise<string> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Geçersiz dosya tipi');
  }
  
  // Validate file size
  if (file.size > MAX_SIZE) {
    throw new Error('Dosya boyutu çok büyük');
  }
  
  // Generate secure filename
  const fileId = randomUUID();
  const extension = file.name.split('.').pop();
  const filename = `${fileId}.${extension}`;
  
  // Create tenant directory
  const uploadDir = join(process.cwd(), 'uploads', tenantId);
  await mkdir(uploadDir, { recursive: true });
  
  // Save file
  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);
  
  return `/uploads/${tenantId}/${filename}`;
}
```

### 8. Environment Security

#### Environment Variables Validation
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('Geçerli veritabanı URL\'si gerekli'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET en az 32 karakter olmalıdır'),
  NEXTAUTH_URL: z.string().url('Geçerli NEXTAUTH_URL gerekli'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY en az 32 karakter olmalıdır'),
  ALLOWED_ORIGINS: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional()
});

export const env = envSchema.parse(process.env);
```

### 9. Security Headers

#### Comprehensive Security Headers
```typescript
// src/lib/security.ts
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};
```

### 10. Security Testing

#### Security Test Suite
```typescript
// tests/security.test.ts
import { describe, it, expect } from 'vitest';
import { validatePassword, hashPassword, verifyPassword } from '@/lib/auth';

describe('Security Tests', () => {
  it('should validate strong passwords', () => {
    const result = validatePassword('StrongPass123!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should reject weak passwords', () => {
    const result = validatePassword('weak');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  it('should hash and verify passwords correctly', async () => {
    const password = 'TestPassword123!';
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword(password, hashed);
    
    expect(hashed).not.toBe(password);
    expect(isValid).toBe(true);
  });
});
```

---

## 🛡️ Security Checklist

### Authentication & Authorization
- ✅ Strong password requirements
- ✅ Password hashing with bcrypt
- ✅ JWT token security
- ✅ Session management
- ✅ Role-based access control
- ✅ Multi-tenant isolation

### Input Validation
- ✅ Zod schema validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ File upload validation

### Network Security
- ✅ HTTPS enforcement
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Security headers
- ✅ Content Security Policy

### Data Protection
- ✅ Sensitive data encryption
- ✅ Audit logging
- ✅ Secure file storage
- ✅ Environment variable security
- ✅ Database security

### Monitoring & Response
- ✅ Security event logging
- ✅ Failed login attempts tracking
- ✅ Suspicious activity detection
- ✅ Regular security updates
- ✅ Incident response plan

---

*Son güncelleme: Aralık 2024*
*Security Guide v1.0.0*

