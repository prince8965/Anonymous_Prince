# NearCircle — Hyperlocal Campus & Tech Event Platform

NearCircle is a full-stack, hyperlocal community and event discovery platform designed specifically for students, campus organizers, and tech communities across **Mumbai & Navi Mumbai**.

Built with **React, TypeScript, Vite, Tailwind CSS**, and powered by a robust **Supabase (PostgreSQL)** backend with **Row-Level Security (RLS)** and atomic database procedures.

---

Join communities, discover meetups and hackathons near you, and find the teammates to build with.
Built India-first, open to the world.

![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-4169E1?logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/API%20checks-79%20passing-brightgreen)

[Features](#features) · [Quick start](#quickstart) · [Architecture](#architecture) · [API](#api-reference) · [Deploy](#deployment) · [Roadmap](#roadmap)

</div>

<!--
  Add screenshots here once you have run the app, for example:
  <p align="center"><img src="docs/screenshots/landing.png" width="820" alt="Scroll-driven globe landing page"></p>
-->

---

## Table of contents

- [About](#about)
- [Features](#features)
- [Tech stack](#tech-stack)
- [License](#License)

---

## About

NearCircle is a social platform built around three ideas:

1. **Circles.** Anyone can create or join a community around an interest, a city or a college campus.
2. **Events near you.** Meetups, workshops and hackathons can be searched by distance, date, interest and price, and shown on a list and a map.
3. **Teammates.** Hackathon pages show which skills each team still needs. People post what they are missing and find others who have it.

The first milestone is sized for **up to 5,000 users**. The landing page is a scroll-driven globe animation made from a 24 fps frame sequence.

## Features

**Circles**
- Create, join and leave communities, public or private (with an approval flow)
- Roles: owner, moderator, member. Posts, member management, campus chapters

**Events**
- Meetups, workshops and hackathons, in person or online
- Capacity limits with an **automatic waitlist**: when someone cancels, the oldest waiting person gets the seat
- Price in INR, tags, banners. Events of private circles are visible to members only

**Discovery**
- Search near a point with radius, interest, type, date range, free-only, online toggle and text
- Sort by soonest or nearest. A "live or starting in 24 hours" view
- List and map side by side

**Hackathons and teams**
- Tracks, prize pool, submission deadline, maximum team size
- Create, join and leave teams (one team per person per event, leadership passes on when the leader leaves)

**Builders**
- Skills and interests, public profiles, GitHub and portfolio links
- Verified-student badge when you sign in with a college email from the `colleges` table
- "Looking for teammates" posts with skill matching, and builder search by skill
- Showcase wall for shipped projects

**Platform**
- Report and block, admin moderation endpoints, row level security on every table
- English and Hindi (navigation, landing and Explore are translated)
- Respects the operating system's *reduce motion* setting

## Tech stack

| Layer    | Technology                                                                        |
| -------- | --------------------------------------------------------------------------------- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, GSAP ScrollTrigger |
| -------- | --------------------------------------------------------------------------------- |
| Map      | MapLibre GL with CARTO dark tiles (OpenStreetMap data)                            |
| Backend  | Node.js 20+, Express 4, TypeScript, Zod, helmet, CORS, express-rate-limit         |
| Database | PostgreSQL 15+ with PostGIS                                                       |
| Auth     | Supabase Auth (Google and email code). Built-in dev login for local work          |
| Storage  | Supabase Storage (signed upload URLs)                                             |
| Hosting  | Vercel (web), Render or Railway (API), Supabase (database and auth)               |

## 🌟 Key Highlights

- **Hyperlocal Discovery**: Auto-detects user location on login to pinpoint nearest campus hubs across 30+ localities in Mumbai & Navi Mumbai.
- **Smart Geocoding & Maps**: Automatic real-time venue geocoding with interactive OpenStreetMap fallback and Google Maps integration.
- **Full Auth & Role-Based Access**: Role-based access control (Participants, Campus Organizers, Judges, Admins) secured with Supabase Auth and RLS.
- **Atomic Registrations & Capacity Locking**: Concurrency-safe event RSVP and ticket code generation with database transactions.
- **Team Management & Hackathons**: Create and join teams via secure invite codes with strict duplicate prevention and team size limits.
- **Project Submissions & Judging Workflow**: Track configurations, submission deadlines, multi-criteria scoring rubrics, and automated ranking calculations.
- **Organizer Dashboard & Attendee Rosters**: Complete event lifecycle management (drafts, publishing, attendee rosters with live check-in toggle, and analytics).

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/prince8965/NearCircle.git
cd NearCircle
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-optional-google-maps-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📋 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launch the local development server with Vite |
| `npm run build` | Compile TypeScript and bundle production assets in `dist/` |
| `npm run typecheck` | Run complete TypeScript validation (`tsc -b --noEmit`) |
| `npm run preview` | Locally preview the production build |
| `npm test` | Execute automated test suites |

---

## 🏗️ Architecture & Technology Stack

```
NearCircle Architecture
 ├── Frontend Client
 │    ├── React 19 + TypeScript + Vite
 │    ├── Tailwind CSS for rich modern UI
 │    ├── Lucide React icon system
 │    └── Leaflet / OpenStreetMap / Google Maps integration
 └── Backend & Database (Supabase)
      ├── PostgreSQL 15 with Row-Level Security (RLS)
      ├── Supabase Auth (JWT sessions & bcrypt passwords)
      ├── PostgreSQL Functions (RPC) for atomic operations
      └── Supabase Storage for poster and project assets
```

---

## 📍 Supported Coverage
NearCircle is currently tailored for the **Mumbai Metropolitan Region & Navi Mumbai**:
* **Mumbai Central / Suburbs**: Andheri, Bandra, BKC, Borivali, Dadar, Churchgate, Colaba, Lower Parel, Powai, Juhu, Goregaon, Malad, Kandivali, Ghatkopar, Kurla, Chembur, Vikhroli, Mulund, Thane.
* **Navi Mumbai**: Vashi, Nerul, CBD Belapur, Kharghar, Seawoods, Airoli, Ghansoli, Kopar Khairane, Panvel, Ulwe.

---

## 📄 License
This project is licensed under the MIT License.
