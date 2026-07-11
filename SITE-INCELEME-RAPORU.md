# Avrasya MedTech — Site İnceleme Raporu

Tarih: 7 Temmuz 2026 · İncelenen dosya: `index.html` (1.359 satır, 363 KB)

Genel değerlendirme: Tasarım seviyesi çok yüksek — modern dark tema, 3D implant sahneleri, scroll animasyonları, `prefers-reduced-motion` desteği örnek nitelikte. Ancak yayına alınmadan önce çözülmesi gereken kritik teknik ve içerik sorunları var.

---

## 🔴 Kritik (yayın engelleyici)

### 1. İnternet yoksa site tamamen çöküyor
GSAP ve Three.js CDN'den yükleniyor. README "tam bağımsız, çift tıkla açılır" diyor ama CDN erişilemezse `gsap.registerPlugin(...)` ilk satırda hata fırlatıyor, tüm script ölüyor ve **preloader sonsuza kadar ekranda kalıyor** — ziyaretçi siyah ekranda %00 görüyor. Çözüm: kütüphaneleri dosyaya gömmek (veya yanına koymak) ya da script yüklenemezse preloader'ı gizleyip `.rv` öğelerini gösteren saf-JS bir güvenlik ağı eklemek.

### 2. Mobilde menü yok
900 px altında `.nav-links{display:none}` — hamburger menü hiç yapılmamış. Mobil ziyaretçi sadece kaydırarak gezinebiliyor, hiçbir bölüme doğrudan gidemiyor. Mobil trafiğin genelde %60+ olduğu düşünülürse bu en acil UX eksiği.

### 3. Aynı logo 3 kez gömülü — dosyanın %77'si logo
92 KB'lık base64 logo preloader, nav ve footer'da ayrı ayrı tekrarlanıyor: 363 KB'lık dosyanın ~278 KB'ı bu üç kopya. Logoyu bir kez CSS'te tanımlayıp (`--logo` custom property + `background-image`) üç yerde kullanmak veya PNG'yi optimize etmek (32–88 px'te gösteriliyor; 512 px'lik orijinal gereksiz) dosyayı ~90 KB'a indirir.

### 4. Doğrulanmamış iddialar ve marka tutarsızlığı
"34 ülke, 12.000+ klinik, 2,4 M restorasyon, %98,7 10 yıllık sağkalım" ve footer'daki **CE / ISO 13485 / FDA / MDR** rozetleri — tıbbi cihaz pazarlamasında bu iddiaların belgelenebilir olması yasal zorunluluk. Ayrıca Workflow 4. adımda **"live-tracked by Samay Bot"** yazıyor — eski isim kalıntısı, SMILEBOT® olmalı.

---

## 🟠 Yüksek öncelik

### 5. Türkçe içerik yok, dil düğmesi çalışmıyor
`lang="en"`, tüm içerik İngilizce; nav'daki "EN ▾" düğmesi hiçbir şey yapmıyor. Türkiye merkezli bir firma için TR/EN gerçek dil değişimi (en basit haliyle `data-tr`/`data-en` attribute + JS toggle) yapılmalı — ya da düğme kaldırılmalı.

### 6. Ölü linkler ve işlevsiz form
Footer'daki Careers, Distributors, Download center, Certificates, Case studies, Support portal linklerinin tümü `#contact`'a gidiyor. Bülten formu (`Join`) hiçbir yere veri göndermiyor. İletişim yalnızca `mailto:` — gerçek bir iletişim formu (Formspree/Netlify Forms gibi backend'siz çözümler yeterli), telefon ve adres eklenmeli. E-posta toplanacaksa **KVKK aydınlatma metni ve gizlilik politikası** zorunlu.

### 7. SEO temel eksikleri
Favicon, Open Graph / Twitter Card meta'ları, `canonical`, `theme-color` ve yapılandırılmış veri (Organization + Product JSON-LD) yok. Sosyal medyada paylaşıldığında görselsiz/başlıksız görünecek. 10–15 satırlık ekleme ile çözülür.

### 8. Dış sitelere bağımlı görseller
SMILEBOT görseli `smile.tr`'den, üç yazıcı görseli `tolard.com.tr`'den hotlink. `onerror` fallback'i güzel düşünülmüş ama bu URL'ler değiştiğinde site "placeholder galerisi"ne dönüşür. Görselleri indirip `assets/` altına almak (ve `width/height` vermek) hem güvenilirlik hem CLS açısından doğru.

---

## 🟡 Orta öncelik

### 9. Erişilebilirlik
Öne çıkanlar: "skip to content" linki yok; before/after kaydırıcı yalnız fare/dokunma ile çalışıyor (klavye + `role="slider"` + ok tuşları eklenmeli); özel imleç kullanılırken yerel imleç gizlenmiyor (çift imleç); `--faint` renkli metinler (0.32 opaklık) WCAG kontrast eşiğinin altında; hero istatistiklerinde `<s>` (üstü çizili) etiketi yanlış amaçla kullanılmış — `<span>` olmalı.

### 10. Preloader yapay bekletme
Preloader gerçek yükleme değil, sabit 1,6 sn'lik animasyon. Tek dosyalık bir sitede içerik anında hazır — kullanıcıyı bilerek bekletmek dönüşüm kaybıdır. Öneri: süreyi 0,6–0,8 sn'ye indirmek ya da tamamen kaldırmak.

### 11. SVG gradient kırılganlığı
Tüm ürün kartları ve yazıcı çizimleri ilk karttaki `#g1` gradient tanımına referans veriyor. O SVG DOM'dan kalkar veya `display:none` olursa diğerlerinin hepsi renksiz kalır. `defs`'i body başında gizli bir SVG'ye taşımak güvenli çözüm.

### 12. Performans ince ayarı
İki WebGL sahnesi + 2D canvas aynı anda yaşıyor; `IntersectionObserver` ile görünürlük kontrolü yapılmış (güzel) ama düşük donanımlı cihazlar için partikül sayısını azaltan bir `deviceMemory`/FPS kontrolü eklenebilir. Görünür olmayan sahnelerde `renderer.render` atlanıyor, ancak ticker'lar çalışmaya devam ediyor — küçük ama bedava kazanım.

---

## 🟢 İyi yapılmış olanlar

`prefers-reduced-motion` için eksiksiz fallback; dokunmatik cihazlarda imleç ve ağır efektlerin kapatılması; dış linklerde `rel="noopener"`; görsel hatalarında otomatik placeholder; `100svh` kullanımı; sekmeli sayı hizalama (`tabular-nums`); yazıcı seçim sihirbazının mantığı ve sonucun karta yansıtılması.

---

## Önerilen sıra

| # | İş | Etki | Efor |
|---|----|------|------|
| 1 | CDN çökme güvenlik ağı / kütüphaneleri yerelleştir | Kritik | Düşük |
| 2 | Mobil hamburger menü | Kritik | Orta |
| 3 | Logo tekilleştirme + optimizasyon (~270 KB kazanım) | Yüksek | Düşük |
| 4 | "Samay Bot" düzeltmesi + iddiaların teyidi | Yüksek | Düşük |
| 5 | Favicon + OG/meta + JSON-LD | Yüksek | Düşük |
| 6 | TR/EN dil desteği | Yüksek | Orta |
| 7 | Gerçek iletişim formu + KVKK metni | Yüksek | Orta |
| 8 | Görselleri yerelleştir | Orta | Düşük |
| 9 | Erişilebilirlik paketi (slider klavye, kontrast, skip-link) | Orta | Orta |
| 10 | Preloader kısaltma, SVG defs taşıma, perf ayarı | Düşük | Düşük |

İstenirse bu maddelerin hepsi mevcut tek-dosya yapısı bozulmadan uygulanabilir.
