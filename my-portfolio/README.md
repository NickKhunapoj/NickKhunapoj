# Premium Next.js Portfolio

A modern, high-end, Apple-inspired portfolio website built with Next.js App Router, Supabase, and Framer Motion. 

This project features a fully responsive, dark-mode design with smooth animations, glassmorphism, and a comprehensive admin dashboard for managing all content.

## Features

- **Apple-Inspired Design:** Minimalist dark mode with subtle mesh gradients, glassmorphism, and 3D hover effects.
- **Smooth Animations:** Framer Motion scroll reveals, floating elements, and seamless transitions.
- **Dynamic Content:** All sections (About, Awards, Certifications) are dynamically rendered from a Supabase backend.
- **Interactive Showcase:** Projects and Awards use a rotating carousel/tab system with auto-play and smooth transitions.
- **Image Lightbox:** Clickable images in Projects and Awards open a polished fullscreen viewer with keyboard navigation.
- **Admin Dashboard:** A responsive, grouped sidebar dashboard for full CRUD control (Profiles, Education, Experience, Projects, Skills, Awards, Certifications, Test Scores).
- **Secure Access:** Supabase Row Level Security (RLS) ensures public users only see active content, while authenticated admins can manage records.
- **Reduced-Motion Toggle:** A manual toggle (in navbar and mobile menu) to disable heavy animations for lower-spec devices. Also respects the system `prefers-reduced-motion` setting.

## Setup Instructions

### 1. Database Initialization

This project requires a Supabase project.

1. Go to your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Open the file `database/migrations/001_create_tables.sql` from this repository.
4. Copy its contents and paste it into the Supabase SQL Editor.
5. Click **Run** to execute the script.

This script will:
- Create all required tables (`profiles`, `education`, `experiences`, `certifications`, `projects`, `skills`, `awards`, `test_scores`).
- Enable Row Level Security (RLS) on all tables.
- Create policies for public read access (where `is_active = true`) and full admin access.
- Set up automatic `updated_at` triggers.

Run later migration files in order as the project evolves. The analytics feature requires:

```sql
database/migrations/006_create_analytics_tables.sql
```

### 2. Environment Variables

Create a `.env.local` file in the root of the project with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and is used for protected admin/storage/analytics route handlers. Never expose it in browser code.

Optional for Vercel Cron cleanup and Supabase Pause Prevention:

```bash
CRON_SECRET=long-random-secret
ANALYTICS_CRON_SECRET=long-random-secret
```

`CRON_SECRET` is server-only. Generate it with a password manager or a command such as `openssl rand -base64 32`, then add it to Vercel Environment Variables. The analytics cleanup route accepts either `ANALYTICS_CRON_SECRET` or `CRON_SECRET`.

### 3. Local Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see the public site.
Visit `http://localhost:3000/admin` to access the admin dashboard.

## Releases

This project uses `standard-version` for semantic version bumps, changelog generation, release commits, and tags. Write commits with Conventional Commit prefixes such as `feat:`, `fix:`, `docs:`, or `chore:`.

```bash
npm run release:dry-run
npm run release
```

The current migration baseline is `1.1.0`. After this migration is committed, run `npm run release:first` once if you need to create the initial `v1.1.0` release commit and tag. Future releases should use `npm run release`.

## First-Party Analytics

The portfolio includes an admin-only analytics dashboard at `/admin/analytics`. Public page views are tracked through the first-party route `POST /api/analytics/track`; Supabase keys and service-role credentials are never sent to visitors.

Collected analytics fields include anonymous visitor/session IDs, page path, URL, title, referrer/referrer domain, UTM parameters, timestamp, browser, browser version, OS, device type, user agent, screen size, language, timezone, approximate Vercel-provided country/region/city when available, bot flag, entry/exit paths, and practical time-on-page/session duration.

Privacy notes:
- `/admin` routes and static asset paths are skipped by default.
- No passwords, form contents, Supabase tokens, or admin-private data are collected.
- Raw IP addresses are not exposed to the browser. When IP tracking is enabled, the server stores a salted SHA-256 hash only; disabling IP anonymization leaves the IP fingerprint blank.
- Do Not Track and Global Privacy Control are respected when the admin setting is enabled.
- Tracking can be disabled from the Analytics Settings panel.
- Analytics tables have RLS enabled and no unsafe public read policies. Browser visitors write only through the protected server route.

Data retention defaults to 30 days and can be changed from `/admin/analytics` between 1 and 730 days. The admin page includes a manual cleanup button that calls:

```bash
POST /api/admin/analytics/cleanup
```

For Vercel Cron, add `ANALYTICS_CRON_SECRET` and schedule a request such as:

```json
{
  "crons": [
    {
      "path": "/api/admin/analytics/cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Configure the cron request with `Authorization: Bearer $ANALYTICS_CRON_SECRET` if you call the endpoint outside an authenticated admin session. Vercel Cron may use `Authorization: Bearer $CRON_SECRET`; that is also accepted.

### Vercel Production Checklist

Set these Vercel Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANALYTICS_CRON_SECRET=optional-long-random-secret
```

Run `database/migrations/006_create_analytics_tables.sql` in Supabase before deploying analytics. The public tracker posts to `/api/analytics/track`, and the server route uses Vercel request headers such as `x-forwarded-for`, `x-vercel-ip-country`, `x-vercel-ip-country-region`, `x-vercel-ip-city`, `user-agent`, and `referer` when available. If Vercel location headers are missing, location fields gracefully show as unknown.

To confirm production tracking:

1. Deploy to Vercel with the variables above.
2. Visit the public site in a normal browser window, not `/admin`.
3. Open DevTools Network and confirm `POST /api/analytics/track` returns JSON.
4. Open `/admin/analytics` after signing in and check Recent Page Views.
5. Visit a URL with UTM parameters, such as `/?utm_source=test&utm_medium=manual&utm_campaign=production-check`, then refresh the dashboard.

Troubleshooting:
- If analytics shows no data, confirm the migration ran, Vercel env vars are present, and `/api/analytics/track` returns JSON.
- If `/api/analytics/track` returns `tracked: false`, check Do Not Track, tracking settings, ad blockers, and whether the path is excluded.
- `/admin`, `/api`, Next internals, and static assets are intentionally excluded.
- Public browser code never writes directly to Supabase analytics tables; the server route writes using the server-only service-role key.
- If Supabase returns `PGRST205`, run the analytics migration and refresh the Supabase schema cache.
- Browser ad blockers can block URLs containing `analytics`; this tracker fails silently so the public site keeps working.

## Supabase Pause Prevention

This project includes a small first-party keep-alive endpoint inspired by [travisvn/supabase-pause-prevention](https://github.com/travisvn/supabase-pause-prevention). Vercel Cron calls a protected Next.js route every 3 days, and that route performs one lightweight Supabase database update so the project has safe periodic activity.

Route:

```bash
GET /api/cron/supabase-keepalive
```

The route is server-only, runs on the Node.js runtime, and requires `CRON_SECRET`. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically when that environment variable is configured. For manual testing only, the route also accepts `?token=YOUR_CRON_SECRET`; do not paste real secrets into public logs or issue trackers.

Run this migration in Supabase before enabling the cron:

```sql
database/migrations/007_create_keepalive_status.sql
```

It creates a single-row `keepalive_status` table plus the `record_keepalive_ping()` RPC. The table has RLS enabled, no public read/write policies, and is updated through the server-side service-role Supabase client only. The row tracks the last ping time, ping count, and source without storing visitor data.

`vercel.json` schedules the keep-alive endpoint in UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/supabase-keepalive",
      "schedule": "0 0 */3 * *"
    }
  ]
}
```

Local testing:

```bash
curl http://localhost:3000/api/cron/supabase-keepalive
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/supabase-keepalive
```

The first request should return `401` or `503` JSON. The authorized request should return `ok: true` after the migration and environment variable are configured.

Vercel verification:

1. Add `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Vercel.
2. Run `database/migrations/007_create_keepalive_status.sql` in Supabase.
3. Deploy to Vercel.
4. Check Vercel Cron logs for `/api/cron/supabase-keepalive`.
5. Confirm the `keepalive_status.last_ping_at` value updates in Supabase.

Troubleshooting:
- If the route returns `cron_secret_not_configured`, add `CRON_SECRET` to Vercel and redeploy.
- If it returns `keepalive_failed` with a migration/schema-cache hint, run migration `007` and refresh the Supabase schema cache.
- If cron does not run, confirm the Vercel project is on a plan that supports cron jobs and that the schedule is read from `vercel.json`.

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Styling:** CSS Modules with Global Variables
- **Animations:** Framer Motion
- **Deployment:** Vercel

## Accessibility

- **Reduced-Motion Toggle:** Click the ✦ icon in the desktop navbar or use the toggle in the mobile menu to reduce/disable animations. The preference is saved to localStorage and also respects the OS-level reduced motion setting.
- **Image Lightbox:** Supports keyboard navigation (ESC to close, arrow keys to navigate). All interactive elements have ARIA labels.
- **Mobile Menu:** Full drawer with keyboard focus trapping, ESC to close, and touch-friendly controls.

## Deployment

This project is ready to be deployed on Vercel. 
Simply push your repository to GitHub, connect it to Vercel, and add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel Environment Variables.
