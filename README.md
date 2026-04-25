# Expense Tracker PWA — Next.js + Supabase

A mobile-friendly expense tracker built with Next.js App Router and Supabase, ready for Vercel deployment.

## What changed in this version

This version replaces Prisma/Postgres direct access with **Supabase Auth + Supabase Postgres + Row Level Security**.

It now supports:

- phone number + password login
- register form with **number, name, preferred password, confirm password**
- per-user private data using Supabase Auth user ids
- configurable categories, payment methods, and split names per user
- one-time expenses
- recurring expenses: **daily, weekly, monthly, quarterly, yearly**
- monthly income and savings calculation
- dashboard grouping by date, category, or spent where
- dark/light mode
- PWA install support
- mobile responsive layout

## Stack

- Next.js 16 App Router
- React 19
- Supabase SSR auth (`@supabase/ssr`)
- Supabase JS client
- Vercel deploy target

## Privacy model

- Mobile number is used for authentication in **Supabase Auth**.
- Expense data is stored in app tables using **`user_id`**.
- Phone number is **not repeated in expense rows**.
- Supabase **Row Level Security (RLS)** ensures users can only access their own data.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your env file

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=service_role_xxxxxxxxxxxxxxxxx
```

> Note: `SUPABASE_SERVICE_ROLE_KEY` is required by the server-side Supabase client used for auth/session handling. Keep it private and do not expose it in the browser.

### 3. Create database objects in Supabase

Open the Supabase SQL Editor and run:

`src/db/setup.sql`

This creates:

- `profiles`
- `categories`
- `payment_methods`
- `people`
- `monthly_incomes`
- `expenses`
- `expense_split_people`
- `recurring_expenses`
- `recurring_split_people`
- profile trigger from `auth.users`
- all required RLS policies

### 4. Configure Auth

In Supabase Dashboard:

- Enable **Phone** auth
- Keep **password-based auth** enabled
- For this low-cost version, disable phone confirmation / SMS verification if you do not want OTP cost right now

### 5. Run locally

```bash
npm run dev
```

Open:

`http://localhost:3000`

## Deployment on Vercel

1. Push project to GitHub
2. Import into Vercel
3. Add the same two env vars in Vercel Project Settings
4. Deploy

## Notes on recurring expenses

Recurring expenses are stored as templates in Supabase and expanded into the selected month inside the app runtime. This keeps deployment simple and avoids needing a scheduled job just to render monthly dashboards.

## Important operational note

This version assumes **phone + password** login without OTP for now. That is cheaper, but it also means the phone number is not being actively verified unless you later turn verification back on.
