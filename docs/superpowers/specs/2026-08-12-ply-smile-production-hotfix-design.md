# Production PLY and Smile Design Hotfix — Design Specification

**Date:** 2026-08-12  
**Status:** Approved direction; written specification pending final user review  
**Target:** `avrasyamedtech.com` static Digital Clinic showroom on Vercel

## Objective

Bring the production scanner and Smile Design rooms into parity with the supplied `Diş kliniği web tasarımı.zip` reference without changing the established public-site architecture, CRM routes, or broader visual direction.

## Confirmed defects

1. Production does not load the supplied full-resolution upper and lower jaw PLY files. It reconstructs very small derived meshes, so the scan lacks the reference model's dental surface detail.
2. The example Smile Design flow no longer uses the supplied aligned before/after patient pair. A later runtime patch generates a row of simplified rectangular teeth instead.
3. The production mobile layout itself reflows correctly and exposes 46–50 px controls without horizontal overflow. The hotfix must preserve that behavior.

## Selected approach

Apply a focused hotfix to the current static showroom loaded by `index.html`:

- serve the supplied `scan-upper.ply` and `scan-lower.ply` as real static assets;
- lazy-load both PLY files only when the visitor enters or starts the scanning experience;
- retain the current lightweight derived mesh as an explicit fallback for unsupported, memory-constrained, failed, or reduced-data sessions;
- restore the supplied `example-before.jpg` and `example-after.jpg` pair for the example-patient Smile Design path;
- keep custom uploads local and use the existing deterministic Canvas/landmark pipeline for user images;
- remove the simplified block-teeth result from the example-patient path;
- preserve the current Turkish-first, ceramic-white, Avrasya-navy and restrained-mint visual system.

This is preferred over rebuilding the production application in Next.js because the deployed repository now intentionally uses a static Vercel showroom and contains separate CRM functionality that must remain untouched.

## Experience design

### Scanner

The scan viewport remains the signature clinical instrument. Before loading, it presents the existing dark navy clinical stage and an honest ready/loading state. When scanning starts, the true upper and lower jaw surfaces appear progressively. Visitors can choose upper jaw, lower jaw, or both, and switch mesh, solid, and tone-map views.

The implementation must not claim that the visual progress represents real acquisition speed or verified scanner accuracy. Existing pending-verification labels remain visible.

### Smile Design

The example-patient mode uses the ZIP's matched photographic pair. The comparison handle reveals the same patient's aligned result rather than a generic tint or synthetic CSS teeth. Shade, form, style, width, height, and guide controls remain available, but only controls with a defensible visual effect may alter the rendered result.

For custom uploads, processing stays in-browser. If landmarks cannot be detected or the external landmark runtime is unavailable, the interface switches to deterministic guided positioning and clearly identifies it as a visualization fallback. No image upload to Avrasya servers is introduced.

### Mobile

At 360–430 px:

- the scan canvas and control panels remain single-column;
- PLY loading is deferred until user intent and falls back safely if device capability is insufficient;
- comparison media uses the full available width without horizontal overflow;
- controls remain at least 44 px high;
- drag interactions retain range/keyboard alternatives;
- essential state and instructions remain outside WebGL/canvas.

## Architecture and data flow

1. `index.html` loads the compressed showroom payload as it does today.
2. Runtime patching injects the corrected scanner and Smile Design behavior into the showroom source.
3. Scanner intent triggers the full PLY loader. Successful geometry replaces the lightweight fallback; failure leaves the fallback active and announces a non-blocking status.
4. Example Smile Design reads fixed local before/after assets.
5. Custom Smile Design reads an object URL, performs local processing, updates the local result URL, and revokes replaced URLs.
6. Whitening and Final rooms consume the most recent designed result where available.

No CRM, Neon, authentication, lead, DNS, or database behavior changes.

## Asset and performance policy

- Full PLY files are reference-authoritative but exceed the site's initial asset budgets, so they must never be part of initial page load.
- Browser caching is enabled for PLY assets.
- Loading state includes progress when measurable and a retry action on failure.
- Only one WebGL renderer is active in the room.
- On constrained mobile sessions, reduced-data preference, WebGL failure, or allocation failure, the derived mesh/static state remains available.
- The initial route payload and LCP image are not increased by the PLY assets.

## Accessibility

- The scanner has a textual status region that exposes ready, loading, complete, fallback, and error states.
- Jaw and view selectors retain native button semantics, visible focus, and selected state.
- The before/after comparison retains a labeled range input and keyboard arrow control.
- Results do not rely on color alone.
- Reduced-motion mode skips progressive reveal animation while retaining the final model or fallback.
- Mobile targets remain at least 44 CSS pixels.

## Testing

Automated regression coverage must prove:

- both full PLY asset paths exist and are requested only after scan intent;
- a successful scan produces a non-empty rendered model;
- PLY failure preserves the lightweight fallback and readable status;
- example mode uses distinct before and after assets;
- example mode contains no block-teeth overlay;
- custom upload stays local and replaces/revokes object URLs;
- desktop and 390 px mobile layouts have no horizontal overflow;
- scanner and comparison controls work with keyboard input;
- `/crm` and its API files are unchanged.

Manual browser verification covers desktop and mobile screenshots, scan interaction, smile comparison, console/network failures, reduced motion, and WebGL fallback. A short recording captures scan start through model reveal and Smile Design comparison.

## Deployment

1. Implement on `codex/fix-ply-smile-production` from current `origin/main`.
2. Run the repository tests plus focused static/runtime/browser checks.
3. Push the branch and open a PR to `main`.
4. Verify the Vercel preview on desktop and mobile, including `/crm` smoke checks.
5. Merge only after the preview is green; the existing Vercel production integration publishes `main`.
6. Run post-deploy smoke checks on `https://avrasyamedtech.com/`.

## Acceptance criteria

- The scanner renders the supplied dental PLY surfaces on capable desktop devices.
- Mobile receives the full model only when safe and otherwise gets a functional fallback.
- Example Smile Design visibly compares the supplied matched patient images.
- Simplified rectangular-teeth output is absent from example mode.
- Local-upload privacy and clinical disclaimers remain intact.
- No horizontal overflow occurs at 360, 390, or 430 px.
- Keyboard, focus, reduced-motion, and WebGL-failure paths remain usable.
- CRM files and behavior show no regression.
- Tests, preview verification, screenshots, recording, accessibility notes, and performance impact are included in delivery artifacts.

## Risks

- The full upper PLY is roughly 14.3 MB and the lower PLY roughly 5 MB, so slow connections require a clear progress/fallback path.
- Binary PLY parsing can exceed memory on low-end mobile devices; capability gating is mandatory.
- The current showroom source is distributed as a compressed payload plus runtime patches. Patch assertions must fail closed when source signatures change.
- External MediaPipe availability can affect custom-photo landmark detection, but must not affect the example-patient result or guided fallback.
