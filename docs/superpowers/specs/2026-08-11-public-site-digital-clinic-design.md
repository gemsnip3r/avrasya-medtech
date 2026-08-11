# Avrasya MedTech Public Site — Digital Clinic Journey Design

## Goal
Rebuild only the public `avrasyamedtech.com` experience as a premium, immersive, conversion-oriented digital dental clinic journey based on the uploaded “Avrasya Dijital Klinik” reference. `/crm` and the Neon CRM backend remain untouched.

## Experience
The homepage is a continuous journey rather than a product grid: Hero / Reception → SmileBot → Intraoral Scanning → AI Smile Design → Whitening → Implant Planning → Digital Lab → 3D Printing → Final Smile → Build Your Digital Clinic / Contact.

## Visual language
- Ceramic white / warm pearl backgrounds with deep Avrasya navy (`#163D6D`, `#183D6E`), titanium neutrals and restrained mint (`#A9D9B2`).
- Space Grotesk for display headings and Hanken Grotesk for body copy.
- Editorial Swiss-medical composition with large product imagery, soft cards, subtle borders, depth and controlled motion.
- No generic SaaS dashboard visual language on the public site.

## Responsive UX
- Desktop: 12-column max-width 1280–1360px layout, sticky navigation, alternating media/text chapters.
- Tablet: 2-column chapters collapse to one column at <= 900px.
- Mobile: purpose-built layout at <= 720px; no horizontal overflow, 16px gutters, `clamp()` typography, 44px minimum interactive targets, content-first image crops, no hover-only controls.
- Navigation becomes an accessible hamburger drawer; long chapter navigation is removed on mobile.
- Heavy 3D/WebGL interactions from the reference are represented with optimized imagery and lightweight UI on mobile.

## Sections
1. Sticky header: brand, Çözümler, Dijital Klinik, Teknolojiler, Hakkımızda, İletişim, primary “Dijital Kliniğini Kur” CTA.
2. Hero: “Dijital diş hekimliğinin tüm akışı. Tek ekosistemde.” with reception/showroom image.
3. Journey rail: visual 8-step clinical workflow.
4. SmileBot: consultation + AI smile communication.
5. Scanner: digital impression / 3D scanning story.
6. Smile Design: before/after visual and design workflow.
7. Whitening / Solara: clinical whitening and therapy.
8. Implant: planning, surgical workflow, product system.
9. Digital Lab: design-to-production bridge.
10. 3D Printer: Tolard/Roxus production chapter.
11. Ecosystem: key technology categories and clinic bundle.
12. Final CTA: “Dijital kliniğinizi birlikte kuralım.” WhatsApp/contact actions.
13. Footer: brand, solution links, contact, legal notes.

## Content principles
- Turkish-first copy.
- Claims remain descriptive and operational; no unverified medical outcome guarantees.
- Product names from the existing business/reference are used where available: SmileBot, intraoral scanner, whitening, implant system, Solara, 3D printer.

## Architecture
- Keep the current static/Vercel architecture.
- Replace public `index.html` only.
- Add new public media under `assets/digital-clinic/`.
- Preserve `crm/`, `api/crm/`, CRM routes and environment variables exactly as-is.
- Use small vanilla JS only for mobile nav, scroll-state/reveal and lightweight interactions.

## Performance & accessibility
- Lazy-load below-the-fold images, explicit dimensions/aspect ratios, `object-fit` crops.
- `prefers-reduced-motion` support.
- Semantic sections/headings, visible focus styles, ARIA on mobile navigation.
- Avoid layout shift and horizontal scroll.

## Acceptance criteria
- Public `/` matches the uploaded Digital Clinic design direction and complete Avrasya MedTech story.
- `/crm` remains operational and unchanged.
- Responsive at 360, 390, 430, 768, 1024, 1440px with no horizontal overflow.
- Navigation, CTA anchors, mobile drawer and contact actions work.
- Main page loads without console-blocking JavaScript errors.