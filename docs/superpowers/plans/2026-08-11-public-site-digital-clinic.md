# Avrasya MedTech Public Site — Digital Clinic Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace only the public homepage with a responsive Digital Clinic Journey experience based on the uploaded Avrasya reference while keeping `/crm` untouched.

**Architecture:** Static `index.html` remains the public entrypoint on Vercel. New reference media is stored under `assets/digital-clinic/`. The page uses semantic HTML, CSS variables/grid, lightweight vanilla JS, responsive breakpoints and progressive enhancement; CRM routes and APIs are outside the change scope.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Vercel static hosting.

## Global Constraints
- Do not modify `crm/`, `api/crm/`, CRM auth/database code or CRM environment variables.
- No horizontal page overflow at 360px or wider.
- Minimum touch target 44px on mobile.
- Preserve Turkish-first public copy and Avrasya brand colors.
- Use lazy-loading for below-the-fold images and reduced-motion fallback.

---

### Task 1: Reference media and public asset structure
**Files:** Create `assets/digital-clinic/*`.
**Produces:** optimized public assets with stable filenames.
- [ ] Copy the selected uploaded assets: logo, reception, SmileBot, scanner, smile before/after, whitening, implant planning, implant detail, digital lab, printer/model, Solara.
- [ ] Confirm every referenced image path exists.
- [ ] Commit media assets.

### Task 2: Replace homepage structure and design system
**Files:** Modify `index.html`.
**Produces:** full semantic desktop homepage.
- [ ] Write page metadata, font preconnects and brand tokens.
- [ ] Build sticky header and hero.
- [ ] Build Digital Clinic journey rail.
- [ ] Add SmileBot, scanning, smile design, whitening, implant, digital lab and 3D printing chapters.
- [ ] Add ecosystem/bundle section, contact CTA and footer.
- [ ] Commit structural redesign.

### Task 3: Responsive and mobile-first behavior
**Files:** Modify `index.html`.
**Produces:** responsive public site with dedicated mobile UX.
- [ ] Add <=1024, <=900, <=720, <=480 breakpoints.
- [ ] Convert split layouts to one column, clamp typography and enforce 16px mobile gutters.
- [ ] Add mobile nav drawer and 44px touch targets.
- [ ] Ensure media uses safe aspect ratios/object positioning and content does not overflow.
- [ ] Add `overflow-x: clip` safety without hiding component-level overflow bugs.
- [ ] Commit responsive work.

### Task 4: Lightweight interactions and accessibility
**Files:** Modify `index.html`.
**Produces:** working nav, reveal, CTA and accessible controls.
- [ ] Add mobile menu toggle with `aria-expanded` and Escape handling.
- [ ] Add IntersectionObserver reveal with reduced-motion fallback.
- [ ] Add active header state on scroll and smooth in-page navigation.
- [ ] Verify focus-visible styles, heading hierarchy, alt text and labels.
- [ ] Commit interactions.

### Task 5: Verification and deployment
**Files:** Test public `index.html`; verify untouched CRM paths.
**Produces:** preview-ready PR.
- [ ] Run HTML/JS syntax checks and scan for broken local asset references.
- [ ] Check CSS for fixed widths/min-widths that can overflow mobile.
- [ ] Verify `/crm` files show no diff.
- [ ] Open PR from `feat/public-site-digital-clinic` to `main`.
- [ ] Validate Vercel preview `/` and `/crm` responses before production merge.