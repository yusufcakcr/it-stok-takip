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
- **Kullanıcı (USER)**: Günlük operasyonel envanter ve stok işlemleri (Tüm hareketleri işlem günlüğüne yazılır; günlüğü yalnızca yönetici görüntüleyebilir).
- **Kapalı Kayıt**: `/signup` yalnızca sistemde hiç kullanıcı yokken açıktır; ilk hesap ADMIN olur, sonrasında kullanıcıyı yalnızca yönetici ekler.
- **Maksimum Kullanıcı Koruması**: Varsayılan 5 kullanıcı sınırı (`MAX_USERS` ile değiştirilebilir).
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
| **Yetkilendirme** | Rota bazlı `proxy.ts` katmanı + rota içi `requireUser()` kontrolü |

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
```bash
cp .env.example .env
```

Zorunlu alanlar:

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `AUTH_SECRET` | Oturum imzalama anahtarı — `openssl rand -base64 32` ile üretin |

> `.env` dosyası `.gitignore` kapsamındadır ve asla commit edilmemelidir.

### 4. Veritabanını Senkronize Edin ve Örnek Verileri Yükleyin
```bash
npx prisma db push
npm run seed
```

Seed betiği kaynak kodda şifre taşımaz. İlk yöneticiyi seed ile oluşturmak isterseniz `.env`
içine `SEED_ADMIN_EMAIL` ve `SEED_ADMIN_PASSWORD` (en az 8 karakter) ekleyin; eklemezseniz
yönetici oluşturulmaz.

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

## 🔐 İlk Yönetici Hesabı

Sistemde **varsayılan şifre yoktur.** Veritabanında hiç kullanıcı yokken `/signup` ekranı açıktır ve
orada oluşturulan **ilk hesap otomatik olarak ADMIN** olur. İlk kullanıcı oluştuktan sonra kayıt
ekranı kapanır; yeni kullanıcıları yalnızca bir yönetici **Kullanıcı Yönetimi** sayfasından ekleyebilir.

Alternatif olarak `.env` içindeki `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` değişkenleriyle
`npm run seed` çalıştırarak yönetici oluşturabilirsiniz.

### Güvenlik notları
- Parolalar bcrypt (cost 12) ile saklanır, asgari uzunluk 8 karakterdir.
- `/admin/*`, `/logs` ve `/api/users`, `/api/logs` uçları yalnızca ADMIN rolüne açıktır; kontrol hem
  `proxy.ts` katmanında hem de rotanın kendi içinde (`requireUser`) yapılır.
- Stok giriş/çıkışı atomik `increment` / koşullu `decrement` ile yazılır; eşzamanlı işlemlerde
  kayıp güncelleme (lost update) ve eksi stok oluşmaz.

---

## 🧪 Doğrulama

```bash
npm run lint       # kod kalitesi
npm run typecheck  # TypeScript tip denetimi
npm run build      # production build
```

---

## 📄 Lisans

Bu proje kurum içi IT departmanı kullanımı ve envanter takibi için hazırlanmıştır.
