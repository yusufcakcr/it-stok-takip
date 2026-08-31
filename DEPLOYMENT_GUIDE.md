# 🚀 IT Stok Takip Sistemi — Yayına Alma ve Kurulum Kılavuzu (Deployment Guide)

Bu kılavuz, **IT Stok Takip Sistemi** web uygulamasını yerel geliştirme ortamında veya canlı sunucuda (VPS, Docker, Vercel vb.) sıfırdan kurup yayına almak için hazırlanmıştır.

---

## 📋 Gereksinimler

- **Node.js**: v20.9.0 veya daha güncel LTS sürümü
- **NPM** veya **Yarn**
- **PostgreSQL**: v14, v15 veya v16 (Yerel, Docker, Supabase, Neon veya Cloud SQL)

---

## 🛠️ 1. Hızlı Başlangıç (Yerel Kurulum)

### Adım 1: Bağımlılıkları Yükleyin
```bash
npm install
```

### Adım 2: Çevre Değişkenlerini (.env) Yapılandırın
`.env.example` dosyasını `.env` olarak kopyalayın ve veritabanı bağlantı adresinizi güncelleyin:

```ini
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/it_stok_takip?schema=public"
NEXTAUTH_SECRET="guclu_ve_gizli_anahtar_32_karakter"
AUTH_SECRET="guclu_ve_gizli_anahtar_32_karakter"
```

### Adım 3: Veritabanı Tablolarını Oluşturun ve Başlangıç Verilerini Yükleyin (Seed)
```bash
npx prisma db push
npm run prisma:seed # veya: npx tsx scripts/safe-seed.ts
```

> **Varsayılan Yönetici Girişi:**
> - **Kullanıcı Adı**: `admin` veya `admin@itstok.com`
> - **Şifre**: `admin123`

### Adım 4: Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda `http://localhost:3000` adresini açın.

---

## 🚢 2. Canlı Sunucuya Yayına Alma (Production Deployment)

### Yöntem A: Node.js / PM2 ile VPS / Dedicated Sunucuda Çalıştırma

1. **Production Build Alın:**
   ```bash
   npm run build
   ```
2. **PM2 ile Sürekli Çalıştırın:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "it-stok-takip" -- start -- -p 3000
   pm2 save
   pm2 startup
   ```
3. **Nginx Reverse Proxy Yapılandırması (Örnek):**
   ```nginx
   server {
       listen 80;
       server_name stok.sirketiniz.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

### Yöntem B: Docker ile Çalıştırma

`Dockerfile` oluşturup uygulamanızı konteyner olarak çalıştırabilirsiniz:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🧪 3. Kalite Kontrol ve Testleri Çalıştırma

Tüm güvenlik, veri bütünlüğü, CRUD ve UI kontrollerini otomatik test etmek için:

```bash
# Kod Kalitesi ve Lint Kontrolü
npm run lint

# Kapsamlı QC Test Paketi
node scripts/qa-test-suite.mjs

# Production Build Testi
npm run build
```

---

## 🔐 4. Güvenlik & İş Kuralları Özeti

1. **Max 5 Kullanıcı Limiti**: Sistem maksimum 5 aktif kullanıcı destekler.
2. **Rol Ayrımı (RBAC)**:
   - `ADMIN`: Kullanıcı yönetimi, şifre sıfırlama, tam envanter yönetimi (Admin işlemleri loglanmaz).
   - `USER`: Standart envanter ve stok işlemleri (Tüm hareketler `/logs` altında kaydedilir).
3. **Stok Güvenliği**: Stoktan çıkış işlemleri atomik transaction altında yürütülür; yetersiz stok durumunda işlem engellenir ve eksi stok oluşamaz.
