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

### 2. Environment Variables

Create a `.env.local` file in the root of the project with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Local Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see the public site.
Visit `http://localhost:3000/admin` to access the admin dashboard.

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
