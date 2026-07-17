<h1 align="center">
AI-Powered Collaborative Travel Planning and <br> Group Trip Management Platform
</h1>

---

## 📝 Abstract

<div align="justify">
GlobeTrotter is a full-stack AI-assisted travel planning web application designed to simplify how individuals and groups plan, organize, and manage trips. The platform integrates intelligent destination discovery, real-time flight search, cost estimation, and collaborative group trip management into a single cohesive experience.
</div>

<br>
<div align="justify">
Built with Next.js 16 App Router and powered by a Supabase backend, GlobeTrotter enables users to search destinations, build personalized itineraries, split costs across travelers, and collaboratively vote on group destinations — all from a modern, responsive interface. The application is deployed on Vercel with server-side rendering safeguards and client-side data fetching to ensure performance and reliability.
</div>

---

## 📁 Repository Structure

```bash
GlobeTrotter/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx          # User login page
│   │   │   └── signup/page.tsx         # User registration page
│   │   ├── (dashboard)/
│   │   │   ├── home/page.tsx           # Dashboard home with trip overview
│   │   │   ├── search/page.tsx         # Destination & flight search
│   │   │   ├── trips/
│   │   │   │   ├── page.tsx            # All trips listing
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Trip detail view
│   │   │   │       └── breakdown/      # Cost breakdown page
│   │   │   ├── group/
│   │   │   │   ├── create/page.tsx     # Create a group trip
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Group discovery & destinations
│   │   │   │       ├── itinerary/      # AI-generated group itinerary
│   │   │   │       ├── vote/           # Destination voting page
│   │   │   │       ├── join/           # Join group via invite link
│   │   │   │       └── leave/          # Leave group page
│   │   │   ├── payment/page.tsx        # Trip booking & payment flow
│   │   │   └── profile/page.tsx        # User profile management
│   │   ├── api/
│   │   │   ├── auth/callback/          # Supabase OAuth callback handler
│   │   │   ├── search/destinations/    # Destination search API route
│   │   │   └── search/flights/         # Flight search API route
│   │   ├── layout.tsx                  # Root layout with global providers
│   │   └── page.tsx                    # Landing/root redirect page
│   ├── components/
│   │   └── layout/                     # Shared layout components (navbar, footer)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Supabase browser client (SSR-safe)
│   │   │   └── server.ts               # Supabase server client
│   │   ├── data/                       # Static data (destinations, hotels, activities, transport)
│   │   └── utils.ts                    # Shared utility functions
│   ├── types/
│   │   └── index.ts                    # TypeScript type definitions
│   └── proxy.ts                        # Auth session refresh (Next.js proxy/middleware)
├── public/                             # Static assets
├── .env.example                        # Environment variable template
├── supabase_schema.sql                 # Full database schema with RLS policies
├── next.config.ts                      # Next.js configuration
├── tsconfig.json                       # TypeScript configuration
├── package.json                        # Project dependencies
└── README.md                           # Project documentation
```

---

## 🎯 Key Features

- **Destination Discovery** — Browse and search curated travel destinations with rich metadata including country, region, cost estimates, and travel highlights
- **Flight Search** — Real-time flight lookup with dynamic cost estimation based on origin, destination, and travel dates
- **Trip Management** — Create, view, and manage personal trips with full cost breakdowns across flights, hotels, activities, and food
- **Group Trip Collaboration** — Create group trips, invite members via shareable links, and coordinate destinations together
- **Destination Voting** — Group members vote on candidate destinations; real-time leaderboard tracks results
- **AI-Generated Itineraries** — Day-by-day itinerary plans automatically generated based on the group's top-voted destination
- **Cost Breakdown** — Detailed per-person cost estimates split across all travel categories with visual charts
- **Booking & Payment Flow** — Integrated payment page for trip confirmation with dynamic cost calculation
- **Authentication** — Secure email/password and OAuth sign-in via Supabase Auth
- **Responsive UI** — Fully mobile-responsive design built with Tailwind CSS v4 and Framer Motion animations

---

## 🛠️ Technologies Used

- **Framework**: Next.js 16.2.3 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Frontend**: React 19, Tailwind CSS v4, Framer Motion, Lucide React
- **Backend & Auth**: Supabase (PostgreSQL + Row Level Security + Auth)
- **Deployment**: Vercel (_deployment link coming soon_)
- **Package Manager**: npm
- **Dev Tools**: ESLint, PostCSS

---

## 🗄️ Database Schema

The Supabase PostgreSQL database includes the following core tables:

| Table | Description |
|-------|-------------|
| `profiles` | User profile data linked to Supabase auth |
| `trips` | Individual trip records with destination, dates, budget |
| `trip_activities` | Activities scheduled within a trip |
| `group_trips` | Group trip metadata, status, and winning destination |
| `group_members` | Many-to-many relationship of users in group trips |
| `destination_votes` | Votes cast by group members on destinations (one vote per member) |

> Row Level Security (RLS) is enabled on all tables.

---

## ⚙️ Local Setup Instructions

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- npm

### 2. Clone & Install

```bash
git clone https://github.com/aacalanche/GlobeTrotter.git
cd GlobeTrotter
npm install
```

### 3. Environment Variables

Copy the provided template and fill in your Supabase project values (Supabase Dashboard → Settings → API):

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 4. Database Setup

In your Supabase Dashboard → SQL Editor, run:

```bash
supabase_schema.sql   # Creates all tables and RLS policies
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Live Deployment

_Deployment link coming soon._

Deployment is handled via Vercel with automatic builds triggered on every push to the main branch of the GitHub repository.

---

## 📊 Application Pages Overview

| Route | Page |
|-------|------|
| `/home` | Dashboard home with upcoming trips and quick actions |
| `/search` | Search destinations and flights |
| `/trips` | View all saved trips |
| `/trips/[id]` | Detailed trip view with itinerary and stats |
| `/trips/[id]/breakdown` | Full cost breakdown with visual charts |
| `/group/create` | Create a new group trip |
| `/group/[id]` | Group destination discovery and candidate cards |
| `/group/[id]/vote` | Vote on group destination candidates |
| `/group/[id]/itinerary` | AI-generated itinerary for the top destination |
| `/group/[id]/join` | Join a group trip via invite link |
| `/group/[id]/leave` | Leave a group trip |
| `/payment` | Trip booking and payment confirmation |
| `/profile` | User profile settings |
| `/login` | Sign in page |
| `/signup` | Registration page |

---

## 🔐 Authentication & Security

- User authentication is handled entirely through Supabase Auth (email/password + OAuth)
- All database tables are protected with Row Level Security (RLS) policies — users can only access their own data
- Invite links for group trips use secure UUID-based group IDs
- Environment variables (Supabase keys) are never exposed client-side beyond the public publishable key

---

## 📊 Experimental Results and Analysis

- The application was tested across multiple deployment environments including local development and Vercel's Linux-based production infrastructure
- Key engineering challenges resolved include SSR/prerender compatibility with Supabase's JWT-based browser client, platform-specific npm binary conflicts, and dynamic routing with Next.js App Router
- All pages use `force-dynamic` rendering and client-side data fetching via `useEffect` to ensure compatibility with Vercel's edge deployment model
- The app handles group trips with real-time vote aggregation, live leaderboard ranking, and per-member participation tracking

> If you would like to discuss the architecture, design decisions, or evaluation in more detail, feel free to reach out.

---

## 🌐 Contact

Maintained by **Arturo Calanche**.

- **Email**: arturo.calanche@gmail.com
- **GitHub**: [aacalanche](https://github.com/aacalanche)
