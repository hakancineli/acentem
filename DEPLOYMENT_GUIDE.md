# Acentem CRM - Deployment Guide

## 🚀 Production Deployment

### 1. Environment Setup

#### Production Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/acentem_prod"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"

# API
API_BASE_URL="https://api.yourdomain.com"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload (Optional)
UPLOAD_MAX_SIZE="10485760" # 10MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"
```

### 2. Database Migration

#### PostgreSQL Setup
```bash
# Create production database
createdb acentem_prod

# Run migrations
npx prisma migrate deploy

# Seed production data
npx prisma db seed
```

### 3. Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/acentem
      - NEXTAUTH_SECRET=your-secret-key
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=acentem
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### 4. Nginx Configuration

#### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream acentem {
        server app:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Gzip Compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # Proxy to Next.js
        location / {
            proxy_pass http://acentem;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files caching
        location /_next/static/ {
            proxy_pass http://acentem;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }

        # API routes
        location /api/ {
            proxy_pass http://acentem;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 5. CI/CD Pipeline

#### GitHub Actions
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: acentem_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/acentem_test
      
      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/acentem_test
      
      - name: Run linting
        run: npm run lint
      
      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/acentem_test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Your deployment script here
          echo "Deploying to production..."
```

### 6. Monitoring and Logging

#### Health Check Endpoint
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

#### Logging Configuration
```typescript
// src/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'acentem-crm' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### 7. Backup Strategy

#### Database Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="acentem_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump $DATABASE_URL > $BACKUP_DIR/acentem_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/acentem_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "acentem_*.sql.gz" -mtime +30 -delete

echo "Backup completed: acentem_$DATE.sql.gz"
```

#### Automated Backup with Cron
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

### 8. Security Checklist

#### Security Headers
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security: max-age=31536000
- ✅ Content-Security-Policy: default-src 'self'

#### Authentication Security
- ✅ Strong password requirements
- ✅ JWT token expiration
- ✅ Rate limiting on login
- ✅ CSRF protection
- ✅ Session management

#### Database Security
- ✅ Encrypted connections (SSL)
- ✅ Regular security updates
- ✅ Access control
- ✅ Backup encryption

### 9. Performance Optimization

#### Caching Strategy
```typescript
// src/lib/cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function getCachedData(key: string) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedData(key: string, data: any, ttl: number = 3600) {
  await redis.setex(key, ttl, JSON.stringify(data));
}
```

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_hotel_tenant ON hotels(tenant_id);
CREATE INDEX idx_reservation_hotel ON hotel_reservations(hotel_id);
CREATE INDEX idx_reservation_date ON hotel_reservations(created_at);
CREATE INDEX idx_transaction_tenant ON transactions(tenant_id);
CREATE INDEX idx_transaction_date ON transactions(date);
```

### 10. Scaling Considerations

#### Horizontal Scaling
- Load balancer configuration
- Database read replicas
- CDN for static assets
- Microservices architecture

#### Vertical Scaling
- CPU and memory optimization
- Database query optimization
- Caching strategies
- Connection pooling

---

## 📊 Production Monitoring

### Key Metrics
- **Response Time** - API response times
- **Error Rate** - 4xx/5xx error rates
- **Throughput** - Requests per second
- **Database Performance** - Query execution times
- **Memory Usage** - Application memory consumption
- **CPU Usage** - Server CPU utilization

### Monitoring Tools
- **Application Performance Monitoring** - New Relic, DataDog
- **Log Aggregation** - ELK Stack, Splunk
- **Uptime Monitoring** - Pingdom, UptimeRobot
- **Database Monitoring** - pgAdmin, DataDog Database

---

*Son güncelleme: Aralık 2024*
*Deployment Guide v1.0.0*

