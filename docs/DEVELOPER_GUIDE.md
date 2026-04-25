# Developer Guide

## Architecture

### Frontend

- `src/app/page.tsx` — dashboard
- `src/app/auth/page.tsx` — login/register screen
- `src/app/settings/page.tsx` — profile and per-user configuration

### Server data layer

- `src/lib/supabase/server.ts` — SSR server client
- `src/lib/supabase/client.ts` — browser client
- `proxy.ts` — auth session refresh and auth gate
- `src/lib/queries.ts` — dashboard/config/query composition
- `src/actions/expense-actions.ts` — mutations through server actions

### Database

- `src/db/setup.sql` — schema, trigger, indexes, and RLS policies

## Auth flow

### Login

Uses `supabase.auth.signInWithPassword({ phone, password })`

### Register

Uses `supabase.auth.signUp({ phone, password, options: { data } })`

Metadata captured on signup:

- `full_name`
- `username_seed`

A database trigger on `auth.users` creates a row in `public.profiles`.

## Why the phone number is not stored in expense rows

Phone number is PII. Repeating it in application tables is unnecessary because Supabase Auth already stores the identity. App tables only keep `user_id`, which is what RLS uses for authorization.

## RLS strategy

For user-owned tables, the core policy shape is:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

For relation tables like `expense_split_people`, policy access is delegated through the parent expense table.

## Recurring expenses approach

Recurring expenses are stored as templates:

- `start_date`
- `end_date`
- `recurrence`
- amount / category / payment method / split info

At read time, the app expands occurrences only for the requested month.

### Why this approach

- no cron dependency
- simple Vercel deployment
- easy to understand
- avoids duplicated stored expense rows for future dates

## Default user configuration

On first dashboard load, if the user has no categories, payment methods, or people, the app inserts defaults.

Defaults:

- Categories: Food, Travel, Bills, Shopping, Health, Subscriptions
- Payment methods: UPI, Credit Card, Debit Card, Cash, Net Banking
- People: Self, Partner, Friends

## Known tradeoff

If you disable phone confirmation to avoid OTP cost, the account is only as trustworthy as the submitted phone string + password combination. For stronger identity assurance later, re-enable phone verification or add MFA.
