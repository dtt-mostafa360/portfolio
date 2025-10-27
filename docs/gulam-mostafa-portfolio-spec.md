# Gulam Mostafa Portfolio Blueprint

## 🧩 Project Architecture Overview
- **Core Stack**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion for motion design; Node.js 20 Express API hosted separately with MongoDB Atlas; NextAuth with JWT strategy for secure session handling.
- **Monorepo Structure**: `/apps/web` (Next.js frontend), `/apps/api` (Express backend), `/packages/ui` (shared UI primitives), `/packages/config` (theme tokens, SEO defaults), enabling scalable reuse.
- **Data Flow**: Client interacts with Next.js pages via React Server Components; data fetched through `/api` routes proxying backend service using Axios with retry logic; backend connects to MongoDB with Mongoose models for posts, projects, testimonials, inquiries.
- **Caching & Performance**: ISR for marketing pages (hero, expertise); client-side SWR for admin views; Redis optional layer for rate-limiting and caching popular blog posts.
- **Security**: HTTPS enforced, HTTPOnly JWT cookies, CSRF protection via NextAuth, rate limiting on contact form submissions, input validation using Zod on both client and server.
- **Observability**: Vercel Analytics for frontend, Logflare for structured logs, OpenTelemetry instrumentation on API with alerts routed to Slack.

## 🖥️ Frontend Code Structure (Component Map)
- `/apps/web/app/layout.tsx`: Root layout, sets `<html lang="en">`, global metadata, font imports (Inter + Space Grotesk), theme provider.
- `/apps/web/app/page.tsx`: Landing page orchestrating sections: `<HeroSection />`, `<AboutSection />`, `<ExpertiseSection />`, `<FeaturedProjects />`, `<Testimonials />`, `<LatestInsights />`, `<ContactCTA />`.
- Components (in `/apps/web/components`):
  - `HeroSection.tsx`: Animated headline “Driving Profitable Growth Through Data-Driven Marketing”, CTA buttons (“Book a Growth Audit”, “Download Case Study”), background data-visual pattern (Framer Motion).
  - `AboutSection.tsx`: Highlights 7+ years, includes KPI counters (e.g., “$18M attributable revenue influenced”).
  - `ExpertiseSection.tsx`: Card grid of services (Traffic Arbitrage, CRO, Lifecycle Automation, Performance Media Buying), filterable by channel type.
  - `FeaturedProjects.tsx`: Uses dynamic filters (Industry, Channel) with motion-enabled cards containing ROI metrics.
  - `Testimonials.tsx`: Carousel leveraging Embla + motion; includes client logos.
  - `LatestInsights.tsx`: SSR block listing top 3 blog posts from API with category chips.
  - `ContactCTA.tsx`: Form using React Hook Form + Zod; fields for name, email, marketing spend, goals; success toast.
  - `MetricsBanner.tsx`: Global stats ribbon.
  - `Navigation.tsx`, `Footer.tsx`, `ThemeToggle.tsx`, `SeoHead.tsx`.
- Styling:
  - Tailwind config extends color tokens (`growth-blue`, `conversion-amber`, `trust-slate`) derived from brand config.
  - Typography scale defined in `/packages/ui/typography.ts` with heading/body utilities.
- Routing:
  - `/projects/[slug]`: Detailed case study pages with ROI charts (using Recharts) and step-by-step playbook.
  - `/blog/[slug]`: MDX-driven posts rendered with shiki highlighting, SEO metadata.
  - `/insights`: Paginated blog index with filters (Topic: Acquisition, Analytics, Retention).
  - `/contact`: Dedicated lead capture page with embedded Calendly widget.
- Accessibility: Skip-to-content link, semantic landmarks, focus-visible styles, aria labels for animations.

## ⚙️ Backend/API Endpoints
- Base URL: `https://api.gulamgrowth.com` hosted on Render.
- Authentication: `/auth/login` (email + password for admin), `/auth/refresh`, `/auth/logout` issuing JWT with role claims (`admin`, `editor`).
- Blog:
  - `GET /posts`: Query params `page`, `limit`, `tag`, `search`.
  - `POST /posts`: Admin-only; payload includes `title`, `slug`, `excerpt`, `content`, `tags`, `coverImage`, `publishAt`.
  - `GET /posts/:slug`, `PATCH /posts/:id`, `DELETE /posts/:id`.
- Projects:
  - `GET /projects`: Supports filters `industry`, `channel`, `kpi` for ROI showcase.
  - `POST /projects`: Creates case study with metrics (`baseline`, `uplift`, `roi`), narrative, tactics array.
  - `GET /projects/:slug`, `PATCH`, `DELETE`.
- Testimonials: CRUD endpoints capturing client name, role, quote, impact metrics.
- Contact:
  - `POST /contact`: Validates payload, pushes to MongoDB `leads` collection and triggers SendGrid notification; rate-limited via Redis.
- Settings:
  - `GET /settings/theme` for front-end config; stored in `settings` collection.
- Analytics Webhooks: `/integrations/analytics`: Accepts POST from advertising platforms to log campaign KPIs into `performanceLogs`.
- Database Schema Highlights:
  - `Project` model with nested `metrics` object and `growthStack` array.
  - `Post` model with `seo` subdocument (title, description, keywords).
  - `Lead` model storing status (`new`, `contacted`, `qualified`).

## 🧭 Admin Panel Logic & Flow
- Accessible at `/admin` (Next.js route protected via NextAuth `withAuth` middleware verifying `admin` role).
- Layout: Sidebar navigation (Dashboard, Content, Portfolio, Testimonials, Leads, Settings).
- Dashboard Overview: Displays real-time pipeline metrics (pending leads, published posts, active campaigns) via SWR fetching from backend.
- Content Management:
  - Blog Editor: Rich text via TipTap with predefined blocks (ROI callout, KPI tables). Autosave drafts every 30s. Slug generation based on title, with uniqueness check.
  - Project Manager: Form capturing objective, strategy, KPIs, timeline; uploads before/after charts to S3 via signed URLs.
  - Testimonials: Inline editing with approval toggle controlling public visibility.
- Leads CRM:
  - Table listing contact submissions with filters by budget range and status.
  - Detail drawer shows message, marketing budget, desired outcomes; actions to assign follow-up tasks (integration with Trello webhook optional).
- Settings:
  - Theme Controls: Choose color palette, toggle light/dark, update typography scale stored in `settings` collection.
  - SEO Defaults: Update meta title, description, canonical URL; recalculates sitemap via backend job.
- Permissions:
  - `admin`: Full CRUD.
  - `editor`: Can edit posts/projects/testimonials but not settings.
- Activity Log: Every mutation writes to `auditLogs` with actor, action, timestamp displayed in admin audit tab.

## 🛠️ Customization Guide (Config + Themes)
- `/packages/config/branding.ts`:
  ```ts
  export const branding = {
    name: "Gulam Mostafa",
    tagline: "Driving Profitable Growth Through Data-Driven Marketing",
    primaryPalette: {
      light: { primary: "#1B4E9B", accent: "#F5A524", background: "#F8FAFF", foreground: "#0B1320" },
      dark: { primary: "#8CB4FF", accent: "#FFC866", background: "#050B1A", foreground: "#E5ECFF" }
    },
    metrics: [
      { label: "Revenue Influenced", value: "$18M+" },
      { label: "Funnel Conversion Lift", value: "38% avg" },
      { label: "Campaigns Launched", value: "120+" }
    ],
    social: {
      linkedIn: "https://www.linkedin.com/in/gulam-mostafa-growth",
      newsletter: "https://gulamgrowth.com/newsletter"
    }
  } as const;
  ```
- `/packages/config/navigation.ts`: JSON defining menu items, section anchors, CTA URLs, enabling quick industry-specific adjustments.
- Theme Switching: `ThemeProvider` reads from `branding.primaryPalette` and applies CSS variables (`--color-primary`, `--color-accent`). Additional themes can be added by extending palette objects and toggled via admin settings.
- Content Seeding: `seed.ts` script populates database with case studies (e.g., `Fintech CPA Optimization`, `Ecommerce Native Ads Scale`) containing KPI arrays; easily swapped for other industries by editing metrics.
- SEO Config: `next-seo.config.ts` exports defaults (open graph, twitter card). Admin updates trigger backend job regenerating `sitemap.xml` and revalidating ISR pages.
- Localization Ready: `@lingui` integration with translation files in `/packages/config/locales`. Strings in components wrap with `Trans` for easy adaptation.

## 🚀 Deployment Recommendations
- **Frontend**: Deploy `/apps/web` on Vercel with automatic builds from `main`; enable Preview deployments for QA. Configure environment variables for API base URL, NextAuth secrets.
- **Backend**: Deploy `/apps/api` on Render (starter plan) with Dockerfile; connect to MongoDB Atlas cluster. Set up health checks and auto-redeploy on `main` changes.
- **Database**: MongoDB Atlas M10 cluster with VPC peering to Render; enable daily backups and performance alerts.
- **CI/CD**: GitHub Actions workflow running lint (`pnpm lint`), tests (`pnpm test`), type check (`pnpm typecheck`), and Playwright smoke tests before deploy. Use Turborepo caching.
- **Monitoring**: Integrate Sentry for both frontend and backend error tracking; configure Slack notifications for high-severity issues.
- **Edge & CDN**: Utilize Vercel Edge Network for static assets; configure caching headers for images and fonts. Serve case-study media from AWS S3 + CloudFront.
- **Domain & SSL**: Primary domain `gulamgrowth.com`; configure subdomain `api.gulamgrowth.com` via Render custom domain. Ensure automatic SSL renewals via Let's Encrypt.
- **Scalability**: Containerize backend with horizontal scaling on Render; use queue (e.g., BullMQ with Redis) for heavy tasks like report generation. Enable ISR revalidation webhooks when content updates.
