const metrics = [
  { label: "Bugünkü lead", value: "0", detail: "Hedef: 5 nitelikli" },
  { label: "Nitelikli lead", value: "0", detail: "Lead Brain bekliyor" },
  { label: "Demo", value: "0", detail: "Henüz planlanmadı" },
  { label: "Satış", value: "₺0", detail: "Atıf verisi bekleniyor" },
];

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">AVRASYA MEDTECH · MVP</span>
          <h1>GrowthOS Komuta Merkezi</h1>
          <p>Instagram, WhatsApp, CRM ve AI satış zekâsı tek ekranda.</p>
        </div>
        <span className="status">Kurulum devam ediyor</span>
      </header>

      <section className="metrics" aria-label="Temel metrikler">
        {metrics.map((metric) => (
          <article className="card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="panel">
        <div>
          <span className="eyebrow">İLK CANLI AKIŞ</span>
          <h2>Instagram → WhatsApp → Lead Brain → Satış</h2>
          <p>
            Bir müşteri WhatsApp üzerinden yazdığında konuşma kaydedilecek,
            ihtiyaç bilgileri toplanacak, lead puanlanacak ve satış ekibine
            uygulanabilir bir özet hazırlanacak.
          </p>
        </div>
        <ol>
          <li>WhatsApp webhook bağlantısı</li>
          <li>Lead ve konuşma kaydı</li>
          <li>Deterministik nitelendirme</li>
          <li>AI destekli satış özeti</li>
        </ol>
      </section>
    </main>
  );
}
