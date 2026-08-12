# Production PLY and Smile Design Hotfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the production Digital Clinic load the supplied full dental PLY scans on capable devices and restore the supplied matched before/after Smile Design experience while preserving mobile, accessibility, CRM, and deployment behavior.

**Architecture:** Keep the deployed static Vercel showroom architecture. Add reference-authoritative assets under `assets/digital-clinic/`, expose capability and asset-selection helpers in a focused runtime module, and use source patch assertions to connect those helpers to the compressed showroom without modifying CRM code.

**Tech Stack:** Static HTML, vanilla JavaScript, Three.js `PLYLoader`, Canvas, Node.js built-in test runner, Vercel

## Global Constraints

- Do not modify `crm/`, `api/crm/`, Neon configuration, authentication, DNS, or database behavior.
- Full PLY assets load only after explicit scan intent and never contribute to initial route or LCP payload.
- Preserve the existing lightweight mesh as fallback for reduced-data, unsupported WebGL, allocation failure, or request failure.
- Keep uploaded photos local; revoke replaced object URLs.
- Smile Design is visualization, not diagnosis, and must not promise treatment outcomes.
- Maintain 44 CSS pixel minimum mobile controls, visible focus, keyboard alternatives, reduced motion, and no horizontal overflow at 360, 390, and 430 px.
- Production promotion happens only after preview verification and green tests.

---

## File structure

- `assets/digital-clinic/scan-upper.ply`: supplied full upper-jaw binary PLY.
- `assets/digital-clinic/scan-lower.ply`: supplied full lower-jaw binary PLY.
- `assets/digital-clinic/example-before.jpg`: supplied example-patient source.
- `assets/digital-clinic/example-after.jpg`: supplied aligned visualization result.
- `showroom/clinical-assets.js`: capability decisions and canonical asset manifest; no UI rendering.
- `showroom/source-patch.js`: assertive integration patch for scanner and Smile Design source behavior.
- `index.html`: loads the new clinical asset module before source patching.
- `tests/public-showroom.test.mjs`: static/runtime regression tests for asset selection, lazy-loading hooks, smile assets, privacy, and CRM isolation.
- `tests/e2e/showroom.spec.mjs`: browser flow checks for scan intent, Smile Design comparison, keyboard operation, reduced motion, and mobile overflow.
- `scripts/serve-static.mjs`: deterministic local static server used by browser tests.
- `package.json`: adds `test:e2e`, `typecheck`, `lint`, and `build` proof commands required by repository policy.

---

### Task 1: Clinical asset manifest and reference assets

**Files:**
- Create: `showroom/clinical-assets.js`
- Create: `tests/public-showroom.test.mjs`
- Create: `assets/digital-clinic/scan-upper.ply`
- Create: `assets/digital-clinic/scan-lower.ply`
- Create: `assets/digital-clinic/example-before.jpg`
- Create: `assets/digital-clinic/example-after.jpg`

**Interfaces:**
- Produces: `window.AvrasyaClinicalAssets` with `fullScan`, `fallbackScan`, `smileExample`, and `chooseScanMode(capabilities)`.
- `chooseScanMode({ webgl, saveData, deviceMemory, mobile })` returns `'full'` or `'fallback'`.
- Consumes: nothing from later tasks.

- [ ] **Step 1: Write failing manifest and asset-integrity tests**

Add tests that load `showroom/clinical-assets.js` into a VM sandbox and assert:

```js
test('chooses the full PLY pair only for capable sessions', () => {
  assert.equal(assets.chooseScanMode({ webgl: true, saveData: false, deviceMemory: 8, mobile: false }), 'full');
  assert.equal(assets.chooseScanMode({ webgl: true, saveData: true, deviceMemory: 8, mobile: false }), 'fallback');
  assert.equal(assets.chooseScanMode({ webgl: false, saveData: false, deviceMemory: 8, mobile: false }), 'fallback');
  assert.equal(assets.chooseScanMode({ webgl: true, saveData: false, deviceMemory: 2, mobile: true }), 'fallback');
});

test('ships the supplied binary PLY and matched smile images', async () => {
  await assertPly('assets/digital-clinic/scan-upper.ply', 351290, 697206);
  await assertPly('assets/digital-clinic/scan-lower.ply', 122815, 241225);
  assertJpeg('assets/digital-clinic/example-before.jpg');
  assertJpeg('assets/digital-clinic/example-after.jpg');
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test tests/public-showroom.test.mjs`

Expected: FAIL because `showroom/clinical-assets.js` and `assets/digital-clinic/*` do not exist.

- [ ] **Step 3: Copy the four supplied assets**

Copy from the extracted ZIP reference:

```text
assets/scan-upper.ply  -> assets/digital-clinic/scan-upper.ply
assets/scan-lower.ply  -> assets/digital-clinic/scan-lower.ply
assets/example-before.jpg -> assets/digital-clinic/example-before.jpg
assets/example-after.jpg  -> assets/digital-clinic/example-after.jpg
```

Do not transform, resample, or recompress these files.

- [ ] **Step 4: Implement the minimal manifest and capability decision**

Create an IIFE that assigns a frozen object:

```js
(function () {
  function chooseScanMode({ webgl, saveData, deviceMemory, mobile }) {
    if (!webgl || saveData) return 'fallback';
    if (mobile && Number(deviceMemory || 0) < 4) return 'fallback';
    return 'full';
  }

  window.AvrasyaClinicalAssets = Object.freeze({
    fullScan: Object.freeze({
      upper: '/assets/digital-clinic/scan-upper.ply',
      lower: '/assets/digital-clinic/scan-lower.ply'
    }),
    fallbackScan: Object.freeze({ packedBase: '/assets/ply/' }),
    smileExample: Object.freeze({
      before: '/assets/digital-clinic/example-before.jpg',
      after: '/assets/digital-clinic/example-after.jpg'
    }),
    chooseScanMode
  });
})();
```

- [ ] **Step 5: Run focused and baseline tests and verify GREEN**

Run: `node --test tests/public-showroom.test.mjs tests/crm-security.test.mjs`

Expected: PASS with PLY headers reporting the exact supplied vertex and face counts.

- [ ] **Step 6: Commit**

```bash
git add assets/digital-clinic showroom/clinical-assets.js tests/public-showroom.test.mjs
git commit -m "feat: add authoritative clinical scan and smile assets"
```

---

### Task 2: Lazy full-resolution PLY integration with fallback

**Files:**
- Modify: `index.html`
- Modify: `showroom/source-patch.js`
- Modify: `tests/public-showroom.test.mjs`

**Interfaces:**
- Consumes: `window.AvrasyaClinicalAssets.fullScan`, `.fallbackScan`, and `.chooseScanMode()` from Task 1.
- Produces: patched `loadClinicalScans()` returning `{ upper, lower, mode }`, where `mode` is `'full'` or `'fallback'`.

- [ ] **Step 1: Write failing lazy-load and fallback tests**

Add assertions that:

```js
test('loads full PLY paths only inside scan intent flow', () => {
  const index = read('index.html');
  const patch = read('showroom/source-patch.js');
  assert.match(index, /showroom\/clinical-assets\.js/);
  assert.doesNotMatch(index, /preload[^>]+scan-(upper|lower)\.ply/i);
  assert.match(patch, /chooseScanMode/);
  assert.match(patch, /fullScan\.upper/);
  assert.match(patch, /fullScan\.lower/);
});

test('keeps the packed surface loader as a catch fallback', () => {
  const patch = read('showroom/source-patch.js');
  assert.match(patch, /catch[\s\S]+loadPacked/);
  assert.match(patch, /scanFallback/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/public-showroom.test.mjs`

Expected: FAIL because `index.html` does not load the manifest and the source patch has no full-resolution loader.

- [ ] **Step 3: Load the manifest before runtime source patches**

Modify the `index.html` head so script order is:

```html
<script src="/showroom/clinical-assets.js?v=20260812-1"></script>
<script src="/showroom/source-patch.js?v=20260812-3"></script>
<script src="/showroom/module-patch.js?v=20260812-1"></script>
```

- [ ] **Step 4: Patch the scanner loader minimally**

In `showroom/source-patch.js`, replace the current unconditional packed loader block with logic that:

```js
const caps = {
  webgl: !!window.WebGLRenderingContext,
  saveData: !!navigator.connection?.saveData,
  deviceMemory: navigator.deviceMemory || 0,
  mobile: matchMedia('(max-width: 720px)').matches
};
const mode = window.AvrasyaClinicalAssets.chooseScanMode(caps);

try {
  if (mode !== 'full') throw new Error('scanFallback: capability');
  const { upper, lower } = window.AvrasyaClinicalAssets.fullScan;
  const [gU, gL] = await Promise.all([load(upper), load(lower)]);
  return { gU, gL, mode: 'full' };
} catch (error) {
  const [gU, gL] = await Promise.all([loadPacked('upper'), loadPacked('lower')]);
  return { gU, gL, mode: 'fallback', error };
}
```

Preserve `computeVertexNormals()`, material modes, controls, disposal, and the existing progressive scan trigger. Update textual scan status to announce fallback without blocking the journey.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `node --test tests/public-showroom.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html showroom/source-patch.js tests/public-showroom.test.mjs
git commit -m "fix: lazy-load full dental PLY scans with fallback"
```

---

### Task 3: Restore matched Smile Design before/after behavior

**Files:**
- Modify: `showroom/source-patch.js`
- Modify: `tests/public-showroom.test.mjs`

**Interfaces:**
- Consumes: `window.AvrasyaClinicalAssets.smileExample` from Task 1.
- Produces: example mode with distinct `photoSrc` and `afterUrl`; custom mode retains local Canvas output and guided fallback.

- [ ] **Step 1: Write failing Smile Design regression tests**

Add assertions:

```js
test('restores the matched example before and after pair', () => {
  const patch = read('showroom/source-patch.js');
  assert.match(patch, /smileExample\.before/);
  assert.match(patch, /smileExample\.after/);
  assert.match(patch, /afterReady:\s*isExample\s*\?\s*true/);
});

test('does not generate rectangular teeth for example mode', () => {
  const patch = read('showroom/source-patch.js');
  assert.doesNotMatch(patch, /renderGuidedDesign\(\)[\s\S]+roundRect/);
  assert.match(patch, /photoMode !== 'custom'/);
});

test('retains local upload cleanup and custom guided fallback', () => {
  const patch = read('showroom/source-patch.js');
  assert.match(patch, /URL\.revokeObjectURL/);
  assert.match(patch, /renderGuidedDesign/);
  assert.match(patch, /photoMode === 'custom'/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/public-showroom.test.mjs`

Expected: FAIL because the current patch overrides the example result with Canvas block teeth and does not revoke replaced upload URLs.

- [ ] **Step 3: Restore the example-patient pair**

Patch source bindings so example mode resolves:

```js
const example = window.AvrasyaClinicalAssets.smileExample;
const photoSrc = isExample ? example.before : s.customUrl;
const afterReady = isExample ? true : !!s.afterUrl;
const afterUrl = isExample ? example.after : s.afterUrl;
```

Skip `renderGuidedDesign()` for example mode. Keep guide-line toggles as reversible analysis overlays without baking them into the example result.

- [ ] **Step 4: Preserve local custom-photo behavior and revoke URLs**

Before assigning a replacement custom object URL:

```js
if (this.state.customUrl?.startsWith('blob:')) {
  URL.revokeObjectURL(this.state.customUrl);
}
```

Retain landmark-based Canvas processing. Invoke guided Canvas output only for `photoMode === 'custom'` when landmark detection fails. Ensure whitening and final stages use `s.afterUrl || photoSrc`.

- [ ] **Step 5: Run focused and baseline tests and verify GREEN**

Run: `node --test tests/public-showroom.test.mjs tests/crm-security.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add showroom/source-patch.js tests/public-showroom.test.mjs
git commit -m "fix: restore matched smile design comparison"
```

---

### Task 4: Browser automation, accessibility, responsive checks, and proof commands

**Files:**
- Create: `scripts/serve-static.mjs`
- Create: `tests/e2e/showroom.spec.mjs`
- Modify: `package.json`
- Modify: `tests/public-showroom.test.mjs`

**Interfaces:**
- Consumes: completed scanner and Smile Design UI from Tasks 2–3.
- Produces: reproducible `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build` gates.

- [ ] **Step 1: Write failing command-contract test**

Add a test that requires these exact scripts:

```js
assert.deepEqual(Object.keys(pkg.scripts).sort(), ['build', 'lint', 'test', 'test:e2e', 'typecheck'].sort());
```

Define commands as:

```json
{
  "typecheck": "node --check showroom/clinical-assets.js && node --check showroom/source-patch.js && node --check showroom/module-patch.js",
  "lint": "node tests/site-checks.mjs",
  "test": "node --test tests/*.test.mjs",
  "test:e2e": "playwright test tests/e2e/showroom.spec.mjs",
  "build": "node tests/build-static.mjs"
}
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/public-showroom.test.mjs`

Expected: FAIL because the proof scripts and browser test files are absent.

- [ ] **Step 3: Add deterministic static validation and server**

Create `scripts/serve-static.mjs` with path normalization, correct MIME types for `.html`, `.js`, `.jpg`, `.ply`, and `.txt`, and a 404 for paths outside the repository.

Create `tests/build-static.mjs` that validates all `index.html` local references exist, confirms the showroom payload base64 length, and writes no production files.

Create `tests/site-checks.mjs` that rejects broken asset paths, inline claims absent from the pending-verification list, and diffs under `crm/` or `api/crm/` relative to `origin/main`.

- [ ] **Step 4: Add browser tests**

The Playwright test starts from the static server and asserts:

```js
test('defers full PLY until scan intent and renders a model', async ({ page }) => {
  const plyRequests = [];
  page.on('request', request => {
    if (request.url().endsWith('.ply')) plyRequests.push(request.url());
  });
  await page.goto('/');
  expect(plyRequests).toEqual([]);
  await page.getByRole('button', { name: /2 Tarama/ }).first().click();
  await page.getByRole('button', { name: 'Taramayı başlat' }).click();
  await expect(page.getByText('Tarama tamamlandı')).toBeVisible();
  expect(plyRequests).toHaveLength(2);
  await expect(page.locator('canvas')).toBeVisible();
});
```

Also cover:

- aborted PLY requests show fallback state and still render canvas;
- example Smile Design loads two distinct local JPEG paths and no block-teeth overlay;
- comparison range responds to ArrowLeft/ArrowRight;
- reduced-motion mode reaches a stable result;
- 390×844 and 360×800 viewports have `scrollWidth <= innerWidth` and every visible main button is at least 44 px high.

- [ ] **Step 5: Install Playwright as a development dependency and implement scripts**

Run: `npm install --save-dev @playwright/test`

Update `package.json` with the five proof commands. Do not add runtime dependencies.

- [ ] **Step 6: Run every required gate**

Run in order:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

Expected: all commands exit 0 with zero failed tests.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json scripts tests
git commit -m "test: verify clinical showroom across desktop and mobile"
```

---

### Task 5: Preview, artifacts, GitHub, and production verification

**Files:**
- Create: `test-results/ply-smile-hotfix/desktop-scan.png`
- Create: `test-results/ply-smile-hotfix/desktop-smile.png`
- Create: `test-results/ply-smile-hotfix/mobile-scan.png`
- Create: `test-results/ply-smile-hotfix/mobile-smile.png`
- Create: `test-results/ply-smile-hotfix/interaction.webm`
- Create: `test-results/ply-smile-hotfix/verification.md`

**Interfaces:**
- Consumes: all implementation and proof commands.
- Produces: reviewable PR, Vercel preview evidence, production smoke evidence, and required Antigravity artifacts.

- [ ] **Step 1: Re-run the complete verification suite on the final tree**

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
git diff --check
git diff origin/main -- crm api/crm
```

Expected: every command exits 0; CRM diff is empty.

- [ ] **Step 2: Capture local desktop/mobile artifacts**

Using the in-app browser at 1440×1000 and 390×844:

- capture scanner ready and complete states;
- capture Smile Design before/after at a non-50% comparison position;
- record scan start → full model → Smile Design comparison;
- run automated accessibility checks plus manual keyboard/focus/reduced-motion checks;
- record console errors, resource failures, horizontal overflow, and performance impact in `verification.md`.

- [ ] **Step 3: Push and open a PR**

Push `codex/fix-ply-smile-production` to `origin` and open a PR against `main` containing changed files, test output, screenshots, recording, accessibility result, performance note, rollback note, and unresolved risks.

- [ ] **Step 4: Verify Vercel preview**

On the PR preview URL:

- confirm `/` returns 200 and scan requests occur only after intent;
- confirm `/crm` returns 200 and its login shell is unchanged;
- repeat desktop and mobile scanner/Smile Design smoke flows;
- confirm no blocking console error.

- [ ] **Step 5: Promote only after preview verification**

Merge the PR to `main` using the repository's allowed merge method. Do not alter DNS or manually create a separate deployment target. Wait for the existing Vercel production deployment to finish.

- [ ] **Step 6: Post-deploy smoke and rollback readiness**

Verify `https://avrasyamedtech.com/` and `/crm` on desktop and mobile. If scanner, Smile Design, or CRM has a blocker, use Vercel's previous production deployment rollback; do not force-push or rewrite `main`.

- [ ] **Step 7: Commit verification report if it changed after preview**

```bash
git add test-results/ply-smile-hotfix/verification.md
git commit -m "docs: record PLY and smile production verification"
git push
```
