import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const checks = [
  ["defaults to Turkish", () => {
    assert.match(html, /<html lang="tr">/);
    assert.match(html, /let saved='tr'/);
  }],
  ["has Turkish language content", () => assert.match(html, /data-tr=/)],
  ["has mobile menu controls", () => {
    assert.match(html, /class="menu-toggle"/);
    assert.match(html, /class="mobile-panel"/);
    assert.match(html, /aria-controls="mobileMenu"/);
  }],
  ["has SEO sharing metadata", () => {
    assert.match(html, /rel="canonical"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /name="twitter:card"/);
    assert.match(html, /application\/ld\+json/);
  }],
  ["has accessible before-after slider", () => {
    assert.match(html, /role="slider"/);
    assert.match(html, /aria-valuemin="0"/);
    assert.match(html, /tabindex="0"/);
    assert.match(html, /keydown/);
  }],
  ["has CDN and no-JS fallback layer", () => {
    assert.match(html, /window\.AVRASYA_DEPS_READY/);
    assert.match(html, /no-js-fallback/);
    assert.match(html, /noscript/);
  }],
  ["has functional contact and newsletter forms", () => {
    assert.match(html, /id="demoForm"/);
    assert.match(html, /id="newsletterForm"/);
    assert.match(html, /kvkk/);
  }],
  ["has Lottie dental hero", () => {
    assert.match(html, /bodymovin\/5\.12\.2\/lottie\.min\.js/);
    assert.match(html, /id="heroLottie"/);
    assert.match(html, /Avrasya dental implant hero/);
  }],
  ["fills Smilebot gallery with catalog photos", () => {
    assert.match(html, /assets\/smilebot-unit-web\.jpg/);
    assert.match(html, /assets\/smilebot-robot-arm-web\.jpg/);
    assert.match(html, /assets\/smilebot-move-web\.jpg/);
    assert.match(html, /assets\/smilebot-humanoid-web\.jpg/);
    assert.match(html, /assets\/smilebot-deck-web\.jpg/);
    assert.match(html, /assets\/smilebot-kiosk-web\.jpg/);
    assert.doesNotMatch(html, /Catalog image slot 0[1-6]/);
  }],
  ["keeps hero title and visual layout stable", () => {
    assert.match(html, /<h1 class="hero-title" id="heroH1"/);
    assert.doesNotMatch(html, /<h1 class="split" id="heroH1"/);
    assert.match(html, /#hero3d\{position:absolute;top:82px;right:0;bottom:0;left:48%/);
  }],
  ["does not block first paint with preloader", () => {
    assert.match(html, /\.preloader\{display:none!important/);
    assert.match(html, /\.hero \.rv\{opacity:1!important;transform:none!important/);
  }],
  ["uses requested WhatsApp number", () => {
    assert.match(html, /https:\/\/wa\.me\/905070460634/);
    assert.doesNotMatch(html, /905312695454|905345625586/);
  }],
  ["does not ship stale Samay Bot copy", () => {
    assert.doesNotMatch(html, /Samay Bot/);
  }],
];

let failed = 0;
for (const [name, check] of checks) {
  try {
    check();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(`  ${error.message.split("\n")[0]}`);
  }
}

if (failed > 0) {
  process.exitCode = 1;
}
