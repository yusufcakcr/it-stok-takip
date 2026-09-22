# Değişiklik geçmişi

En yeni sürüm en üstte.

## [1.1.0] — 2026-09-22 — Güvenlik ve veri bütünlüğü revizyonu

### 🔴 Güvenlik (kritik)
- **Giriş ekranındaki varsayılan yönetici bilgileri kaldırıldı.** `app/login/page.tsx` siteyi açan
  herkese `admin / admin123` gösteriyordu.
- **Seed içindeki gizli yönetici hesabı ve sabit şifreler kaldırıldı.** `scripts/seed.ts` içindeki
  platform kalıntısı `abacus-…@example.com` hesabı ve `admin123` silindi; yönetici artık yalnızca
  `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` ortam değişkenleriyle oluşuyor ve mevcut bir hesabın
  şifresi seed sırasında sessizce sıfırlanmıyor.
- **Kayıt (`/api/signup`) kapatıldı.** Yalnızca sistemde hiç kullanıcı yokken açık (ilk hesap ADMIN
  olur); sonrasında kullanıcı ekleme ADMIN yetkisi ister. Rol de aynı istekte atanıyor.
- **Kullanılmayan ikinci giriş ucu silindi** (`app/api/auth/login/route.ts`): kimlik doğrulaması
  olmadan çalışıyor, "kullanıcı yok" / "şifre hatalı" ayrımıyla kullanıcı taramasına ve sınırsız
  şifre denemesine açıktı.
- **`.gitignore` eklendi.** Depoda hiç yoktu; `.env`, `.next/`, `node_modules/` yanlışlıkla
  commit edilebilirdi.
- **İşlem günlüğü yöneticiye kısıtlandı** (`/logs`, `/api/logs`): önceden her oturum açan kullanıcı
  herkesin hareketini görebiliyordu. Menüde de yönetim bölümüne taşındı.
- **Güvenlik başlıkları eklendi**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `HSTS`.
- Parola asgari uzunluğu 6 → 8 karaktere çıkarıldı (`lib/constants.ts`, tüm formlar).

### 🟠 Yetkilendirme
- **`proxy.ts` (Next 16 rota katmanı) eklendi**: oturumsuz istek sayfalarda `/login`'e yönlendirilir,
  API'de 401 döner; `/admin/*`, `/logs`, `/api/users`, `/api/logs` rotaları ADMIN rolü ister.
- **`lib/api-auth.ts`** ile tüm API rotaları ortak `requireUser({ admin })` kontrolüne taşındı;
  koruma hem rota katmanında hem rotanın içinde çalışıyor.

### 🟠 Veri bütünlüğü
- **Stok hareketlerindeki kayıp güncelleme (lost update) hatası düzeltildi.** Önce okuyup sonra
  `quantity: okunan + delta` yazan kod, atomik `increment` ve `quantity >= miktar` koşullu
  `decrement` ile değiştirildi. Eşzamanlı iki çıkış artık birbirini ezmiyor, eksi stok oluşmuyor.
- Kategori ve hareket tipi artık sunucuda doğrulanıyor; geçersiz değerler 400 döndürüyor.
- Kullanıcı güncellemede e-posta çakışması anlaşılır hata mesajıyla dönüyor (önceden 500).
- İşlem günlüğü tarih filtrelerinde geçersiz tarih artık 500 üretmiyor.

### 🟡 Bakım ve temizlik
- **`typescript.ignoreBuildErrors` kapatıldı**; ortaya çıkan 3 tip hatası düzeltildi ve
  `npm run typecheck` betiği eklendi. Build artık tip hatalarında duruyor.
- **35 kullanılmayan bağımlılık kaldırıldı** (mapbox-gl, plotly, aws-sdk, azure-storage-blob,
  chart.js, recharts, formik, yup, zod, zustand, jotai, swr, react-query, lodash, webpack …).
- **`package-lock.json` eklendi** — önceden lockfile yoktu, her build farklı sürüm çekebiliyordu.
- Platform kalıntıları silindi: `scripts/qa-test-suite.mjs`, `scripts/check-users.mjs`,
  `scripts/auth-smoke.mjs`, `scripts/test-results.json`, `.yarnrc.yml`, `next.config.js` içindeki
  önizleme alan adı ve `next.config.user.json` mekanizması.
- Kullanıcı sayısı limiti `MAX_USERS` ortam değişkenine bağlandı (varsayılan 5).
- README ve DEPLOYMENT_GUIDE güncellendi: varsayılan şifre bölümü yerine ilk kurulum akışı ve
  güvenlik notları.

## [1.0.0] — 2026-09-01
- İlk sürüm: Next.js 16 + Prisma + Auth.js ile donanım, lisans, sarf malzemesi ve stok hareketi
  yönetimi, gösterge paneli, raporlar ve CSV dışa aktarma.
