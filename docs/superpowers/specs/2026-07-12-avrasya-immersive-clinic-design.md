# Avrasya Medtech Immersive Digital Clinic — Design Specification

**Date:** 2026-07-12  
**Status:** Approved for implementation planning  
**Target workflow:** Google Antigravity Manager Surface with task-scoped agents and verifiable Artifacts

## 1. Objective

Rebuild the current single-file prototype as a production-grade, multilingual, interactive dental technology website. The experience must feel like a visitor enters a premium digital clinic and follows one continuous patient journey from consultation to final temporary mockup.

The website is both:

1. a patient-facing visualization experience; and
2. a B2B sales and product education platform for dentists and clinics.

The primary narrative is:

`Reception → Smilebot consultation → digital scan → smile design → whitening → implant planning when relevant → CAD/CAM preparation → Tolard 3D printing → temporary mockup → final smile → clinic technology proposal`

## 2. Existing State

The repository currently contains a sophisticated monolithic prototype in `index.html`. It includes multiple Three.js scenes, a Smilebot image simulator, whitening comparison, implant and CBCT demonstrations, clinic planner, multilingual text and contact widgets.

The prototype must be preserved as a reference at `legacy/index.html`. New production work must not continue by appending more CSS, HTML and global JavaScript to the legacy file.

## 3. Product Principles

- One continuous story, not disconnected marketing sections.
- Every animation must explain a product, treatment step or state change.
- Medical trust is more important than visual spectacle.
- Product specifications and clinical claims must be verified or visibly marked as unverified content.
- User-uploaded images must remain local by default.
- Every WebGL experience must have an accessible, reduced-motion and non-WebGL fallback.
- Mobile is a first-class experience, not a compressed desktop layout.
- Product content must be structured and reusable across pages, drawers, comparison views and future catalogues.

## 4. Audience

### Primary

- Dental clinic owners
- Dentists and specialists
- Dental laboratories
- Distributors and regional partners

### Secondary

- Patients exploring digital treatment workflows
- Dental students and educators
- Potential service and technical-support customers

## 5. Experience Architecture

### Scene 01 — Brand Portal

The Avrasya icon forms from bridge geometry, implant spine, tooth negative space and precision guides. The visitor can skip the sequence. Reduced-motion mode displays a static premium hero.

### Scene 02 — Reception

A digital clinic reception introduces the complete ecosystem: Smilebot, scanner, whitening, Solara, implant and 3D printing. Visitors can follow the guided journey or jump directly to a room.

### Scene 03 — Smilebot Consultation

Smilebot introduces facial and smile visualization. The screen supports an example patient and local image upload. It explains that the result is a visualization and not diagnosis or guaranteed treatment outcome.

### Scene 04 — Digital Scan Room

A dental mesh is progressively completed. The visitor can rotate upper and lower arches, switch display modes and open scanner product hotspots. Product specifications appear in a contextual drawer.

### Scene 05 — Smile Design Studio

A real browser-based mini application provides:

- local image upload;
- crop and positioning;
- facial midline;
- interpupillary line;
- lip line;
- smile arc;
- gingival line;
- tooth width and height controls;
- tooth-form presets;
- A1, B1, BL2 and BL1 shade presets;
- Natural and Hollywood modes;
- before/after comparison;
- reset and full-screen preview;
- downloadable visualization summary.

Phase one uses deterministic Canvas/SVG overlays and local state. No diagnostic AI claim is permitted. Automated segmentation is a separate later phase.

### Scene 06 — Whitening Lounge

The shade selected in Smile Design becomes the initial state in Whitening. The experience includes comparison, intensity, session visualization, Solara integration, product information and clinical-use disclaimers.

### Scene 07 — Implant Suite

An optimized implant model supports assembled and exploded views, crown, abutment, fixture and guided-placement education. Product dimensions and surfaces come only from verified structured content.

### Scene 08 — Digital Lab

The selected restoration becomes a temporary digital model. The flow illustrates CAD preparation, support creation, nesting, material choice and print preparation.

### Scene 09 — Tolard Printer Selection

T-Rox, Roxus and Roxus Plus can be compared using verified build volume, layer resolution, materials and use cases. Unknown values must be represented by a `verificationStatus: "pending"` field and never invented.

### Scene 10 — Temporary Mockup Printing

A layer-by-layer animation displays print progress, time, resin usage, wash, cure and finished mockup. Device capability determines whether the implementation uses live 3D or a pre-rendered image sequence.

### Scene 11 — Final Smile

Original, planned and mockup views are compared. The visitor sees which technologies and product categories contributed to the result and can download or share a summary.

### Scene 12 — Build Your Digital Clinic

The visitor selects products and services and receives a structured proposal summary covering installation, training, technical support and demo or quotation requests.

## 6. Information Architecture

### Primary routes

- `/[locale]` — immersive clinic journey
- `/[locale]/products` — product catalogue
- `/[locale]/products/[slug]` — product detail
- `/[locale]/solutions/[slug]` — solution and workflow detail
- `/[locale]/support` — support, service and training
- `/[locale]/contact` — demo and quotation forms
- `/[locale]/legal/privacy`
- `/[locale]/legal/kvkk`
- `/[locale]/legal/cookies`

### Supported locales

- Turkish default: `tr`
- English: `en`
- Russian: `ru`
- Arabic: `ar`
- Persian: `fa`

Arabic and Persian require complete RTL verification.

## 7. Visual System

### Brand palette

- Deep navy: `#163D6D`
- Secondary navy: `#1F4D83`
- Titanium: `#B8BDC3`
- Ceramic white: `#F6F7F4`
- Biomaterial mint: `#A9D9B2`
- Interactive cyan: controlled use only for active technology states

### Direction

- Swiss medical design
- Strong typographic hierarchy
- Precise grid and spacing
- Ceramic surfaces and titanium details
- Soft clinical light
- Minimal glass effects
- No generic tooth icons or medical crosses
- No decorative particles without narrative purpose

## 8. Technical Architecture

### Core

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- next-intl
- Zod
- React Hook Form
- Zustand

### Motion and 3D

- GSAP ScrollTrigger for the master journey timeline
- Motion for interface-level transitions
- React Three Fiber and Drei for reusable 3D scenes
- GLTF/GLB assets compressed with Draco or Meshopt
- KTX2 textures where appropriate

### Data and operations

- Supabase for products, leads and form submissions
- Vercel deployment
- Sentry
- Vercel Analytics
- Vercel Speed Insights

## 9. Module Boundaries

- `components/scenes/*` owns one clinic room and its timeline contract.
- `components/simulators/*` owns interactive application logic.
- `components/three/*` owns 3D model rendering and device fallbacks.
- `components/products/*` owns hotspots, drawers and comparisons.
- `stores/journey-store.ts` owns cross-scene continuity.
- `content/products/*` owns verified product content.
- `lib/medical-claims.ts` blocks unverified claims from production rendering.
- `lib/device-capability.ts` selects full, reduced or static rendering mode.

No component may combine multiple rooms. No global render loop may remain active when its scene is outside the viewport.

## 10. Core State Contract

```ts
export type SmileShade = "A1" | "B1" | "BL2" | "BL1";
export type JourneyRoom =
  | "portal"
  | "reception"
  | "consultation"
  | "scan"
  | "smile-design"
  | "whitening"
  | "implant"
  | "lab"
  | "printer"
  | "mockup"
  | "final-smile"
  | "clinic-builder";

export interface JourneyState {
  room: JourneyRoom;
  uploadedImageUrl: string | null;
  selectedShade: SmileShade;
  selectedToothPreset: "natural" | "soft-square" | "oval" | "hollywood";
  implantRequired: boolean;
  selectedPrinterSlug: string | null;
  selectedProductSlugs: string[];
}
```

## 11. Product Data Contract

```ts
export interface ProductRecord {
  slug: string;
  brand: string;
  name: string;
  category: "smilebot" | "scanner" | "whitening" | "solara" | "implant" | "printer";
  summary: string;
  gallery: Array<{ src: string; alt: string }>;
  features: string[];
  specifications: Array<{ label: string; value: string; source?: string }>;
  downloads: Array<{ label: string; url: string }>;
  verificationStatus: "verified" | "pending";
}
```

Production UI must not display `pending` specifications as facts.

## 12. Privacy and Clinical Safety

- Image processing is local by default.
- Object URLs are revoked when the session ends or the image is replaced.
- Images are uploaded to the server only after explicit, separate consent.
- No patient image may enter analytics events.
- Smile Design is labeled as visualization, not diagnosis.
- Results do not represent guaranteed outcomes.
- KVKK, privacy and cookie controls are required before production launch.

## 13. Accessibility

- WCAG 2.2 AA target
- Skip links
- Keyboard navigation for all controls
- Visible focus
- Semantic heading hierarchy
- Keyboard-operable before/after and design sliders
- Reduced-motion mode
- Static alternatives for WebGL
- Text alternatives for meaningful animation states
- No critical information conveyed by color alone

## 14. Performance Budget

- Lighthouse Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+
- Initial route JS target: under 220 KB compressed excluding deferred 3D chunks
- No single initial image above 250 KB
- No initial GLB above 1.5 MB compressed
- Maximum one active WebGL render loop on mobile
- Largest Contentful Paint target: under 2.5 seconds on a representative mid-tier mobile profile
- Cumulative Layout Shift: under 0.1

## 15. Testing Strategy

- Vitest for stores, validation and pure simulator calculations
- React Testing Library for interactive controls
- Playwright for full journey, language, RTL and form flows
- axe checks on key routes and simulator dialogs
- WebGL-unavailable fallback test
- reduced-motion test
- slow-network and asset-failure test
- browser screenshots and recordings as Antigravity Artifacts

## 16. Migration Strategy

1. Move the existing prototype to `legacy/index.html` without changing behavior.
2. Extract verified copy, images and product information.
3. Scaffold the new Next.js application.
4. Build a static and accessible journey shell.
5. Add rooms incrementally.
6. Add cross-room state continuity.
7. Add Smile Design Studio.
8. Add structured products and lead capture.
9. Add optimized 3D scenes and capability fallbacks.
10. Verify desktop, mobile, reduced motion, RTL and WebGL failure modes before replacing production.

## 17. Antigravity Delivery Rules

Each Antigravity task must produce:

- an implementation plan Artifact;
- changed-file summary;
- passing test output;
- desktop screenshot;
- mobile screenshot;
- browser recording for interactive work;
- accessibility check summary;
- explicit unresolved risks.

Agents must not use destructive filesystem commands outside the repository. Deployment, database migrations and deletion operations require manual approval.

## 18. Acceptance Criteria

The redesign is accepted when:

- the legacy prototype remains accessible for comparison;
- all twelve rooms are navigable with and without motion;
- Smile Design works locally without uploading an image;
- selected shade and product state persists through later scenes;
- product claims are sourced or blocked;
- Turkish and English are complete; RU, AR and FA have no broken fallback or layout;
- keyboard and reduced-motion paths are usable;
- Playwright and axe suites pass;
- Lighthouse targets are met on the production candidate;
- Antigravity supplies screenshots and browser recordings for the full journey.