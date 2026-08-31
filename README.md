# 🖥️ IT Stok Takip ve Envanter Yönetim Sistemi

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.7-2D3748?style=flat-square&logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Auth.js](https://img.shields.io/badge/Auth.js-v5-purple?style=flat-square)

Kurumsal iş yerleri ve IT departmanları için özel olarak geliştirilmiş; **donanım**, **yazılım lisansları**, **sarf malzemeleri** ve **stok giriş/çıkış hareketlerini** tek bir güvenli panelden yönetmeyi sağlayan modern, Türkçe arayüzlü ve tam responsive envanter takip web uygulaması.

---

## 🎯 Projenin Amacı ve Kullanım Alanı

Bu sistem, şirket içi IT operasyonlarında karşılaşılan envanter karmaşasını önlemek, şirket demirbaşlarını ve sarf malzemelerini anlık takip etmek, süresi dolan yazılım lisanslarını önceden tespit etmek ve tüm stok hareketlerini denetlenebilir bir kayıt altında tutmak amacıyla tasarlanmıştır.

---

## ✨ Temel Özellikler

### 1. 🖥️ Donanım Yönetimi (Hardware Management)
- Laptop, masaüstü, monitör, sunucu, IP telefon ve dock istasyonları kaydı.
- Marka, model, seri numarası, şirket içi konum (Örn: Sunucu Odası, IT Deposu) takibi.
- Her ürün için bağımsız belirlenebilen **düşük stok eşiği** ve kritik seviye uyarıları.

### 2. 🔑 Lisans Yönetimi (License & Software Management)
- Microsoft 365, Adobe CC, antivirüs, işletim sistemi ve CAD lisansları takibi.
- Güvenlik amaçlı **maskelenmiş lisans anahtarı** görünümü (`****CRET`).
- Bitiş tarihi yaklaşan (30 gün) ve **süresi dolmuş lisanslar** için otomatik renk kodlu alarm sistemi.

### 3. 📦 Sarf Malzemesi Yönetimi (Consumables Management)
- Patch kablolar, adaptörler, piller, termal macunlar ve USB bellekler.
- Esnek birim desteği (*Adet, Kutu, Paket, Metre*).
- Otomatik minimum stok seviyesi alarmları.

### 4. 🔄 Stok Giriş & Çıkış Hareketleri (Stock Movements)
- Tek tıkla ürün bazlı hızlı stok girişi veya stok çıkışı.
- **Atomik Veri Bütünlüğü**: Eşzamanlı işlemlerde ve yetersiz stok durumunda eksi stoğa düşmeyi engelleyen transaction yapısı.
- İşlem açıklaması, miktar, kullanıcı ve zaman damgalı hareket geçmişi.

### 5. 🛡️ Rol Bazlı Yetkilendirme ve Güvenlik (RBAC & Audit Trail)
- **Yönetici (ADMIN)**: Tam envanter yönetimi, kullanıcı ekleme/silme, şifre sıfırlama (Şirket kuralı gereği Admin işlemleri loglanmaz).
- **Kullanıcı (USER)**: Günlük operasyonel envanter ve stok işlemleri (Tüm hareketler `/logs` altında kaydedilir).
- **Maksimum 5 Kullanıcı Koruması**: Güvenlik ve kaynak yönetimi için 5 kullanıcı sınırı.
- **Yönetici Kendi Hesabını ve Son Yöneticiyi Silme Koruması**.

### 6. 📊 Gösterge Paneli (Dashboard)
- Toplam kategori bazlı ürün ve adet sayaçları.
- Düşük stoklu kritik ürünler uyarı paneli.
- Süresi dolan/yaklaşan lisanslar alarm listesi.
- Son 10 stok hareketi canlı akış tablosu.

### 7. 📈 Raporlama ve Excel / CSV Dışa Aktarma
- **Genel Stok Raporu**, **Stok Hareketleri Raporu** ve **Düşük Stok Raporu**.
- Excel ile tam uyumlu **Türkçe Karakter Destekli (UTF-8 BOM)** dinamik `.csv` indirme.
- Yazıcı dostu yazdırma görünümü (`no-print` optimizasyonu).

### 8. 📱 Kullanıcı Dostu ve Mobil Uyumlu (UI/UX)
- Kurumsal IT temalı modern Dark Mode (Koyu lacivert ve mavi vurgular).
- Mobil cihazlar ve tabletler için optimize edilmiş hamburger menü ve çekmece düzeni.
- Türkçe hata ve toast bildirimleri (`sonner`).
- Kurumsal temalı özel 404 Sayfası.

---

## 🛠️ Teknoloji Mimarisi

| Katman | Teknoloji / Kütüphane |
|---|---|
| **Frontend Framework** | Next.js 16 (App Router + Turbopack) |
| **Programlama Dili** | TypeScript |
| **Stil & Tema** | Tailwind CSS, Lucide React Icons |
| **Veritabanı ORM** | Prisma ORM 6.7 |
| **Veritabanı** | PostgreSQL (Neon Cloud / Yerel) |
| **Kimlik Doğrulama** | Auth.js v5 (NextAuth.js Beta) + BcryptJS |
| **Test & QC** | Kapsamlı Otomatik QA Test Suite (ESM) |

---

## 🚀 Hızlı Başlangıç ve Kurulum

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/yusufcakcr/it-stok-takip.git
cd it-stok-takip
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Çevre Değişkenlerini (.env) Ayarlayın
`.env.example` dosyasını referans alarak `.env` oluşturun:
```ini
DATABASE_URL="postgresql://kullanici:sifre@host:5432/veritabani?sslmode=require"
NEXTAUTH_SECRET="guclu_ve_gizli_anahtar_32_karakter"
AUTH_SECRET="guclu_ve_gizli_anahtar_32_karakter"
```

### 4. Veritabanını Senkronize Edin ve Başlangıç Verilerini Yükleyin
```bash
npx prisma db push
npx tsx scripts/seed.ts
```

### 5. Uygulamayı Başlatın
```bash
# Geliştirme Modu
npm run dev

# veya Production Modu
npm run build
npm run start
```
Tarayıcınızda `http://localhost:3000` adresine gidin.

---

## 🔐 Varsayılan Giriş Bilgileri

Sistem kurulumdan sonra otomatik olarak hazır bir yönetici hesabıyla başlar:

- **E-posta**: `admin@itstok.com`
- **Kullanıcı Adı**: `admin`
- **Şifre**: `admin123`

---

## 🧪 Testleri Çalıştırma

Uygulamanın tüm güvenlik, CRUD, veri bütünlüğü ve responsive kontrollerini test etmek için:

```bash
# Kod Kalitesi
npm run lint

# Otomatik QA Test Paketi
node scripts/qa-test-suite.mjs

# Production Build
npm run build
```

---

## 📄 Lisans

Bu proje kurum içi IT departmanı kullanımı ve envanter takibi için hazırlanmıştır.
