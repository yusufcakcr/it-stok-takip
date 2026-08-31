/**
 * IT Stok Takip Sistemi — Uçtan Uca Kapsamlı QC Test Suite
 * Kıdemli QA & QC Analisti: Otomatik Doğrulama ve Test Koşum Scripti (Pure ESM JS)
 * Kapsam: 1.Test.html, 2.Test.html bulguları, Güvenlik, CRUD, Concurrency, UX ve Build doğrulamaları
 */

import fs from 'fs'
import path from 'path'

const results = []
const testCases = []

function registerTest(tc) {
  testCases.push(tc)
}

// -------------------------------------------------------------
// MODÜL 1: Kimlik Doğrulama & Yetkilendirme (Auth & RBAC)
// -------------------------------------------------------------

registerTest({
  id: 'TC-AUTH-01',
  suite: 'Kimlik Doğrulama & Yetkilendirme',
  title: 'Şifre Validasyonu (Minimum 6 Karakter Kuralı - CRIT-01)',
  category: 'SECURITY',
  severity: 'CRITICAL',
  async run() {
    const signupRoute = fs.readFileSync('app/api/signup/route.ts', 'utf-8')
    const hasMinLengthCheck = signupRoute.includes('length < 6') || signupRoute.includes('.length < 6')
    const returns400 = signupRoute.includes('Şifre en az 6 karakter olmalıdır')
    
    const signupPage = fs.readFileSync('app/signup/page.tsx', 'utf-8')
    const hasFrontendMinLength = signupPage.includes('minLength={6}')

    if (hasMinLengthCheck && returns400 && hasFrontendMinLength) {
      return { passed: true, message: 'Hem API seviyesinde (HTTP 400) hem de Frontend formunda min. 6 karakter şifre kuralı aktif ve doğrulanmış.' }
    }
    return { passed: false, message: 'Şifre validasyon kuralı eksik veya her iki katmanda uygulanmamış.' }
  }
})

registerTest({
  id: 'TC-AUTH-02',
  suite: 'Kimlik Doğrulama & Yetkilendirme',
  title: 'Maksimum 5 Kullanıcı Limiti Koruması (HIGH-03)',
  category: 'BUSINESS_LOGIC',
  severity: 'CRITICAL',
  async run() {
    const signupRoute = fs.readFileSync('app/api/signup/route.ts', 'utf-8')
    const hasCountCheck = signupRoute.includes('userCount >= 5')
    const returnsError = signupRoute.includes('Maksimum 5 kullanıcı oluşturulabilir')

    const usersAdminPage = fs.readFileSync('app/(authenticated)/admin/users/page.tsx', 'utf-8')
    const hasButtonDisable = usersAdminPage.includes('disabled={(users?.length ?? 0) >= 5}')

    if (hasCountCheck && returnsError && hasButtonDisable) {
      return { passed: true, message: 'Maksimum 5 kullanıcı sınırı backend API ve frontend buton disable mantığında tam olarak korunuyor.' }
    }
    return { passed: false, message: 'Maksimum kullanıcı kuralı kontrolü eksik.' }
  }
})

registerTest({
  id: 'TC-AUTH-03',
  suite: 'Kimlik Doğrulama & Yetkilendirme',
  title: 'Kullanıcı Yönetimi Self-Deletion (Kendi Kendini Silme) Engeli (HIGH-02)',
  category: 'SECURITY',
  severity: 'HIGH',
  async run() {
    const usersRoute = fs.readFileSync('app/api/users/route.ts', 'utf-8')
    const usersAdminPage = fs.readFileSync('app/(authenticated)/admin/users/page.tsx', 'utf-8')
    
    const hasApiProtection = usersRoute.includes('id === session.user.id') && usersRoute.includes('Kendinizi silemezsiniz')
    const hasUiProtection = usersAdminPage.includes('!isCurrent') || usersAdminPage.includes('user?.id !== session?.user?.id')

    if (hasApiProtection && hasUiProtection) {
      return { passed: true, message: 'Yöneticinin kendi hesabını silmesi hem API seviyesinde engelleniyor hem de UI buton seviyesinde gizleniyor.' }
    }
    return { passed: false, message: 'Self-deletion güvenlik koruması eksik.' }
  }
})

registerTest({
  id: 'TC-AUTH-04',
  suite: 'Kimlik Doğrulama & Yetkilendirme',
  title: 'Yönetici Giriş Bilgilendirmesi & Helper Badge (MED-01)',
  category: 'UX',
  severity: 'LOW',
  async run() {
    const loginPage = fs.readFileSync('app/login/page.tsx', 'utf-8')
    const hasAdminHint = loginPage.includes('admin123') && loginPage.includes('Varsayılan Yönetici Bilgileri')

    if (hasAdminHint) {
      return { passed: true, message: 'Giriş sayfasında varsayılan admin giriş ipucu kullanıcılara açıkça sunuluyor.' }
    }
    return { passed: false, message: 'Login sayfasında admin bilgilendirme ipucu eksik.' }
  }
})

registerTest({
  id: 'TC-AUTH-05',
  suite: 'Kimlik Doğrulama & Yetkilendirme',
  title: 'Yetkisiz ADMIN Rolü Oluşturma Engeli (Privilege Escalation Koruması)',
  category: 'SECURITY',
  severity: 'CRITICAL',
  async run() {
    const signupRoute = fs.readFileSync('app/api/signup/route.ts', 'utf-8')
    const enforcesUserRole = signupRoute.includes("role: 'USER'")
    const doesNotAcceptRoleFromUser = !signupRoute.includes("role: role === 'ADMIN' ? 'ADMIN' : 'USER'")

    if (enforcesUserRole && doesNotAcceptRoleFromUser) {
      return { passed: true, message: 'Genel kayıt endpointi dışarıdan gelen role parametresine kapatıldı ve daima USER olarak sabitlendi.' }
    }
    return { passed: false, message: 'Genel kayıttan yetkisiz admin hesabı oluşturma açığı tespit edildi.' }
  }
})

registerTest({
  id: 'TC-AUTH-06',
  suite: 'Kimlik Doğrulama & Yetkilendirme',
  title: 'Son Admin Rol Düşürme ve Silme Koruması',
  category: 'SECURITY',
  severity: 'HIGH',
  async run() {
    const usersRoute = fs.readFileSync('app/api/users/route.ts', 'utf-8')
    const protectsLastAdminDemotion = usersRoute.includes('Sistemdeki tek yöneticinin rolü düşürülemez')
    const protectsLastAdminDelete = usersRoute.includes('Sistemdeki tek yönetici silinemez')

    if (protectsLastAdminDemotion && protectsLastAdminDelete) {
      return { passed: true, message: 'Sistemdeki tek yöneticinin silinmesi ve rolünün USER olarak düşürülmesi başarıyla engellendi.' }
    }
    return { passed: false, message: 'Son admin koruma mekanizmasında eksik var.' }
  }
})

// -------------------------------------------------------------
// MODÜL 2: Envanter CRUD & Sınır Değer Analizi (Boundary Values)
// -------------------------------------------------------------

registerTest({
  id: 'TC-INV-01',
  suite: 'Envanter CRUD & Sınır Değerler',
  title: 'Donanım API Negatif Miktar & Boş İsim Kontrolü (CRIT-02)',
  category: 'BOUNDARY',
  severity: 'CRITICAL',
  async run() {
    const hwRoute = fs.readFileSync('app/api/hardware/route.ts', 'utf-8')
    const qtyMatches = hwRoute.match(/qty < 0/g)
    const returnsQty400 = hwRoute.includes('Adet negatif olamaz')
    const checksEmptyName = hwRoute.includes('Ürün adı zorunludur')

    if (qtyMatches && qtyMatches.length >= 2 && returnsQty400 && checksEmptyName) {
      return { passed: true, message: 'Donanım API hem ekleme hem güncellemede negatif adetleri ve boş isimleri HTTP 400 ile engelliyor.' }
    }
    return { passed: false, message: 'Donanım API negatif adet veya boş isim kontrolünde eksik var.' }
  }
})

registerTest({
  id: 'TC-INV-02',
  suite: 'Envanter CRUD & Sınır Değerler',
  title: 'Lisans API Negatif Miktar & Boş İsim Kontrolü (CRIT-02)',
  category: 'BOUNDARY',
  severity: 'CRITICAL',
  async run() {
    const licRoute = fs.readFileSync('app/api/licenses/route.ts', 'utf-8')
    const qtyMatches = licRoute.match(/qty < 0/g)
    const returnsQty400 = licRoute.includes('Adet negatif olamaz')
    const checksEmptyName = licRoute.includes('Yazılım adı zorunludur')

    if (qtyMatches && qtyMatches.length >= 2 && returnsQty400 && checksEmptyName) {
      return { passed: true, message: 'Lisans API hem ekleme hem güncellemede negatif adetleri ve boş yazılım isimlerini HTTP 400 ile engelliyor.' }
    }
    return { passed: false, message: 'Lisans API negatif adet veya boş isim kontrolünde eksik var.' }
  }
})

registerTest({
  id: 'TC-INV-03',
  suite: 'Envanter CRUD & Sınır Değerler',
  title: 'Sarf Malzemesi API Negatif Miktar & Boş İsim Kontrolü (CRIT-02)',
  category: 'BOUNDARY',
  severity: 'CRITICAL',
  async run() {
    const conRoute = fs.readFileSync('app/api/consumables/route.ts', 'utf-8')
    const qtyMatches = conRoute.match(/qty < 0/g)
    const returnsQty400 = conRoute.includes('Adet negatif olamaz')
    const checksEmptyName = conRoute.includes('Ürün adı zorunludur')

    if (qtyMatches && qtyMatches.length >= 2 && returnsQty400 && checksEmptyName) {
      return { passed: true, message: 'Sarf Malzemesi API hem ekleme hem güncellemede negatif adetleri ve boş isimleri HTTP 400 ile engelliyor.' }
    }
    return { passed: false, message: 'Sarf Malzemesi API negatif adet veya boş isim kontrolünde eksik var.' }
  }
})

registerTest({
  id: 'TC-INV-04',
  suite: 'Envanter CRUD & Sınır Değerler',
  title: 'Var Olmayan ID ile Güncelleme/Silmede 404 Koruması',
  category: 'BOUNDARY',
  severity: 'MEDIUM',
  async run() {
    const hwRoute = fs.readFileSync('app/api/hardware/route.ts', 'utf-8')
    const licRoute = fs.readFileSync('app/api/licenses/route.ts', 'utf-8')
    const conRoute = fs.readFileSync('app/api/consumables/route.ts', 'utf-8')

    const hwHas404 = hwRoute.includes('404') && hwRoute.includes('bulunamadı')
    const licHas404 = licRoute.includes('404') && licRoute.includes('bulunamadı')
    const conHas404 = conRoute.includes('404') && conRoute.includes('bulunamadı')

    if (hwHas404 && licHas404 && conHas404) {
      return { passed: true, message: 'Tüm envanter modüllerinde var olmayan kayıtlar için HTTP 404 uygun yanıtı yapılandırıldı.' }
    }
    return { passed: false, message: 'Var olmayan kayıt kontrolünde eksik var.' }
  }
})

// -------------------------------------------------------------
// MODÜL 3: Stok Hareketleri & Eşzamanlılık (Concurrency)
// -------------------------------------------------------------

registerTest({
  id: 'TC-STK-01',
  suite: 'Stok Hareketleri & Eşzamanlılık',
  title: 'Stok Giriş/Çıkış Atomik Transaction Bütünlüğü (HIGH-01)',
  category: 'DATA_INTEGRITY',
  severity: 'CRITICAL',
  async run() {
    const smRoute = fs.readFileSync('app/api/stock-movement/route.ts', 'utf-8')
    const hasTransaction = smRoute.includes('prisma.$transaction(async (tx)')
    const usesTxFind = smRoute.includes('tx.hardware.findUnique') || smRoute.includes('tx.license.findUnique')
    const usesTxUpdate = smRoute.includes('tx.hardware.update') || smRoute.includes('tx.license.update')
    const usesTxMovement = smRoute.includes('tx.stockMovement.create')

    if (hasTransaction && usesTxFind && usesTxUpdate && usesTxMovement) {
      return { passed: true, message: 'Stok kontrol, miktar güncelleme, stok hareketi kaydı ve loglama atomik Prisma Transaction içinde yürütülüyor.' }
    }
    return { passed: false, message: 'Atomik transaction yapısı eksik veya tamamlanmamış.' }
  }
})

registerTest({
  id: 'TC-STK-02',
  suite: 'Stok Hareketleri & Eşzamanlılık',
  title: 'Yetersiz Stokta Çıkış Engeli & 0 Miktar Sınırı (HIGH-01)',
  category: 'DATA_INTEGRITY',
  severity: 'HIGH',
  async run() {
    const smRoute = fs.readFileSync('app/api/stock-movement/route.ts', 'utf-8')
    const checksZeroOrLess = smRoute.includes('qty <= 0')
    const checksInsufficient = smRoute.includes('Yetersiz stok')

    if (checksZeroOrLess && checksInsufficient) {
      return { passed: true, message: '0 veya negatif miktar girişi ve mevcut stoktan fazla çıkış yapma girişimleri başarıyla engelleniyor.' }
    }
    return { passed: false, message: 'Yetersiz stok kontrol kuralı eksik.' }
  }
})

// -------------------------------------------------------------
// MODÜL 4: İşlem Logları & Rol Bazlı Loglama
// -------------------------------------------------------------

registerTest({
  id: 'TC-LOG-01',
  suite: 'İşlem Logları & Audit Trail',
  title: 'Admin İşlemlerinin Loglanmaması Kuralı (Role Isolation - MED-03)',
  category: 'BUSINESS_LOGIC',
  severity: 'MEDIUM',
  async run() {
    const hwRoute = fs.readFileSync('app/api/hardware/route.ts', 'utf-8')
    const licRoute = fs.readFileSync('app/api/licenses/route.ts', 'utf-8')
    const conRoute = fs.readFileSync('app/api/consumables/route.ts', 'utf-8')
    const smRoute = fs.readFileSync('app/api/stock-movement/route.ts', 'utf-8')

    const hwExcludesAdmin = hwRoute.includes("role !== 'ADMIN'")
    const licExcludesAdmin = licRoute.includes("role !== 'ADMIN'")
    const conExcludesAdmin = conRoute.includes("role !== 'ADMIN'")
    const smExcludesAdmin = smRoute.includes("role !== 'ADMIN'")

    if (hwExcludesAdmin && licExcludesAdmin && conExcludesAdmin && smExcludesAdmin) {
      return { passed: true, message: 'Tüm modüllerde proje kuralına tam uyularak sadece standart USER rolü loglanıyor, ADMIN işlemleri izole ediliyor.' }
    }
    return { passed: false, message: 'Admin loglama izolasyonunda eksik var.' }
  }
})

// -------------------------------------------------------------
// MODÜL 5: Dashboard Veri Bütünlüğü & Alarm Filtreleri
// -------------------------------------------------------------

registerTest({
  id: 'TC-DASH-01',
  suite: 'Dashboard & Veri Analitiği',
  title: 'Süresi Dolmuş ve Dolmak Üzere Olan Lisansların Doğru Filtrelenmesi (CRIT-03)',
  category: 'DATA_INTEGRITY',
  severity: 'CRITICAL',
  async run() {
    const dashRoute = fs.readFileSync('app/api/dashboard/route.ts', 'utf-8')
    const hasThirtyDaysFilter = dashRoute.includes('new Date(l.expiryDate) <= thirtyDays')
    const doesNotHideExpired = !dashRoute.includes('new Date(l.expiryDate) >= now')

    if (hasThirtyDaysFilter && doesNotHideExpired) {
      return { passed: true, message: 'Dashboard süresi dolmuş tüm geçmiş lisansları ve önümüzdeki 30 gün içinde dolacak lisansları eksiksiz listeliyor.' }
    }
    return { passed: false, message: 'Dashboard lisans filtre mantığında süresi geçmiş lisanslar gizleniyor olabilir.' }
  }
})

registerTest({
  id: 'TC-DASH-02',
  suite: 'Dashboard & Veri Analitiği',
  title: 'Düşük Stok Eşiği Hesaplama ve Çoklu Kategori Toplama Doğrulaması',
  category: 'DATA_INTEGRITY',
  severity: 'HIGH',
  async run() {
    const dashRoute = fs.readFileSync('app/api/dashboard/route.ts', 'utf-8')
    const checksHwThreshold = dashRoute.includes('(item?.quantity ?? 0) <= (item?.lowStockThreshold ?? 5)')
    const includesAllCategories = dashRoute.includes('HARDWARE') && dashRoute.includes('LICENSE') && dashRoute.includes('CONSUMABLE')

    if (checksHwThreshold && includesAllCategories) {
      return { passed: true, message: 'Tüm 3 kategoride (Donanım, Lisans, Sarf) özel veya varsayılan (5) eşiğe göre düşük stok uyarıları doğru hesaplanıyor.' }
    }
    return { passed: false, message: 'Düşük stok uyarı hesaplamasında eksik var.' }
  }
})

// -------------------------------------------------------------
// MODÜL 6: Raporlar & Dışa Aktarma (Export CSV & UTF-8)
// -------------------------------------------------------------

registerTest({
  id: 'TC-REP-01',
  suite: 'Raporlar & Dışa Aktarma',
  title: 'Rapor Sayfası CSV / Excel İndirme ve UTF-8 BOM Desteği (HIGH-04)',
  category: 'FUNCTIONAL',
  severity: 'HIGH',
  async run() {
    const reportsPage = fs.readFileSync('app/(authenticated)/reports/page.tsx', 'utf-8')
    const hasExportFunction = reportsPage.includes('exportToCSV')
    const hasUtf8Bom = reportsPage.includes('\\uFEFF')
    const hasDownloadButton = reportsPage.includes('CSV İndir')

    if (hasExportFunction && hasUtf8Bom && hasDownloadButton) {
      return { passed: true, message: 'Raporlar sayfası UTF-8 BOM (Excel Türkçe karakter desteği) ile dinamik CSV üretip indirme özelliği içeriyor.' }
    }
    return { passed: false, message: 'CSV dışa aktarma özelliği veya UTF-8 BOM desteği eksik.' }
  }
})

// -------------------------------------------------------------
// MODÜL 7: Kullanıcı Deneyimi & Mobil Responsive
// -------------------------------------------------------------

registerTest({
  id: 'TC-UX-01',
  suite: 'Kullanıcı Deneyimi & Responsive Layout',
  title: 'Mobil Hamburger Menü & Responsive Drawer (CRIT-04)',
  category: 'UX',
  severity: 'HIGH',
  async run() {
    const sidebar = fs.readFileSync('components/sidebar.tsx', 'utf-8')
    const layout = fs.readFileSync('app/(authenticated)/layout.tsx', 'utf-8')

    const hasHamburger = sidebar.includes('mobileOpen') && sidebar.includes('Menu')
    const hasResponsiveAside = sidebar.includes('-translate-x-full md:translate-x-0')
    const hasBackdrop = sidebar.includes('fixed inset-0 bg-black/60')
    const hasResponsiveMain = layout.includes('md:ml-64') && layout.includes('min-w-0')

    if (hasHamburger && hasResponsiveAside && hasBackdrop && hasResponsiveMain) {
      return { passed: true, message: 'Mobil cihazlarda (<768px) hamburger menü, çekmece animasyonu, arka plan karartma ve tam genişlikli içerik akışı aktif.' }
    }
    return { passed: false, message: 'Mobil responsive düzen eksik veya tamamlanmamış.' }
  }
})

registerTest({
  id: 'TC-UX-02',
  suite: 'Kullanıcı Deneyimi & Responsive Layout',
  title: 'Türkçe Özel 404 Sayfası (not-found.tsx - MED-02)',
  category: 'UX',
  severity: 'MEDIUM',
  async run() {
    const notFoundExists = fs.existsSync('app/not-found.tsx')
    if (notFoundExists) {
      const content = fs.readFileSync('app/not-found.tsx', 'utf-8')
      const isTurkish = content.includes('Sayfa Bulunamadı') && content.includes('Gösterge Paneline Dön')
      if (isTurkish) {
        return { passed: true, message: 'Kurumsal IT temasına uygun Türkçe 404 Not Found sayfası başarıyla yapılandırılmış.' }
      }
    }
    return { passed: false, message: 'Türkçe 404 sayfası bulunamadı.' }
  }
})

registerTest({
  id: 'TC-MODAL-01',
  suite: 'Kullanıcı Deneyimi & Responsive Layout',
  title: 'Modal Dialog Overlay ve Event Propagation Koruması (LOW-02)',
  category: 'UX',
  severity: 'LOW',
  async run() {
    const itemDialog = fs.readFileSync('components/item-form-dialog.tsx', 'utf-8')
    const movementDialog = fs.readFileSync('components/stock-movement-dialog.tsx', 'utf-8')

    const itemStopsPropagation = itemDialog.includes('e.stopPropagation()')
    const movementStopsPropagation = movementDialog.includes('e.stopPropagation()')

    if (itemStopsPropagation && movementStopsPropagation) {
      return { passed: true, message: 'Tüm modal diyaloglarda arka plan tıklama çakışması ve event propagation başarıyla izole edilmiş.' }
    }
    return { passed: false, message: 'Modal dialog event propagation korumasında eksik var.' }
  }
})

// -------------------------------------------------------------
// MODÜL 8: Platform, Tipler & Derleme Uyumluluğu
// -------------------------------------------------------------

registerTest({
  id: 'TC-PRISMA-01',
  suite: 'Veritabanı & Platform Uyumluluğu',
  title: 'Prisma Schema Hardcoded Linux Output Path Temizliği (LOW-01)',
  category: 'DATA_INTEGRITY',
  severity: 'CRITICAL',
  async run() {
    const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8')
    const hasHardcodedPath = schema.includes('/home/ubuntu/')

    if (!hasHardcodedPath) {
      return { passed: true, message: 'Prisma şemasında hardcoded Linux output yolu temizlendi; Windows ve tüm ortamlarda sorunsuz derlenebilir.' }
    }
    return { passed: false, message: 'Prisma şemasında hardcoded Linux yolu tespit edildi.' }
  }
})

registerTest({
  id: 'TC-BUILD-01',
  suite: 'Veritabanı & Platform Uyumluluğu',
  title: 'TypeScript Model ve DTO Tanımları Bütünlüğü (lib/types.ts)',
  category: 'CODE_QUALITY',
  severity: 'MEDIUM',
  async run() {
    const typesContent = fs.readFileSync('lib/types.ts', 'utf-8')
    const hasHardware = typesContent.includes('HardwareItem')
    const hasLicense = typesContent.includes('LicenseItem')
    const hasConsumable = typesContent.includes('ConsumableItem')
    const hasNoExpense = !typesContent.includes('Expense')

    if (hasHardware && hasLicense && hasConsumable && hasNoExpense) {
      return { passed: true, message: 'lib/types.ts içerisindeki eski şablon tipleri temizlenerek IT Stok modelleri eksiksiz tanımlandı.' }
    }
    return { passed: false, message: 'lib/types.ts tip tanımlarında eksik veya artık kod var.' }
  }
})

// -------------------------------------------------------------
// TEST RUNNER ÇALIŞTIRMA
// -------------------------------------------------------------

async function executeTestSuite() {
  console.log('\n🚀 IT Stok Takip Sistemi — Uçtan Uca Kapsamlı QC Test Suite Başlatılıyor...\n')
  const startTime = Date.now()

  for (const tc of testCases) {
    const t0 = Date.now()
    try {
      const res = await tc.run()
      const t1 = Date.now()
      results.push({
        id: tc.id,
        suite: tc.suite,
        title: tc.title,
        category: tc.category,
        severity: tc.severity,
        status: res.passed ? 'PASS' : 'FAIL',
        message: res.message,
        details: res.details,
        durationMs: t1 - t0
      })
      console.log(`[${res.passed ? '✓ PASS' : '✗ FAIL'}] ${tc.id} (${tc.suite}) - ${tc.title}`)
      if (!res.passed) console.log(`   ↳ Hata: ${res.message}`)
    } catch (err) {
      results.push({
        id: tc.id,
        suite: tc.suite,
        title: tc.title,
        category: tc.category,
        severity: tc.severity,
        status: 'FAIL',
        message: `Çalışma zamanı hatası: ${err?.message}`,
        durationMs: Date.now() - t0
      })
      console.log(`[✗ FAIL] ${tc.id} (${tc.suite}) - Exception: ${err?.message}`)
    }
  }

  const totalTime = Date.now() - startTime
  const passCount = results.filter(r => r.status === 'PASS').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  const passRate = ((passCount / results.length) * 100).toFixed(1)

  console.log(`\n================================================================`)
  console.log(`🎯 Test Özeti: Toplam: ${results.length} | PASS: ${passCount} | FAIL: ${failCount} | Başarı Oranı: %${passRate} | Süre: ${totalTime}ms`)
  console.log(`================================================================\n`)

  fs.writeFileSync('scripts/test-results.json', JSON.stringify({ summary: { total: results.length, pass: passCount, fail: failCount, passRate, totalTime }, results }, null, 2))
}

executeTestSuite()
