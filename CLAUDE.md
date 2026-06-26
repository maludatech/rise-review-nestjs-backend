# CLAUDE.md

This file provides guidance to Claude Code when working on the Rise Review NestJS backend — a **port of the Express/MongoDB backend** (`../backend`) to NestJS + PostgreSQL (Prisma).

Read this alongside the Express source to understand intent. When something is unclear in the NestJS code, the Express backend is authoritative.

---

## Commands

```bash
npm run start:dev        # Start dev server (watch mode) — port 3000
npm run build            # Compile to dist/
npm run start:prod       # Run compiled output
npm run lint             # ESLint --fix
npm run test             # Jest unit tests
npm run test:e2e         # End-to-end tests

# Prisma (two separate schemas)
npx prisma migrate dev --schema=prisma/rise-review/rise-review.schema.prisma
npx prisma migrate dev --schema=prisma/internal/internal.schema.prisma
npx prisma generate      # Re-generate Prisma clients after schema change

# Stripe webhook forwarding during local development
stripe listen --forward-to localhost:3000/api/rise-review/stripe/webhook
```

---

## Stack

| Layer            | Technology                                                        |
| ---------------- | ----------------------------------------------------------------- |
| Runtime          | Node.js + NestJS 11 (platform-express)                           |
| Language         | TypeScript                                                        |
| Primary Database | PostgreSQL via Prisma (Rise Review data)                          |
| Secondary DB     | PostgreSQL via Prisma (Internal/admin data)                       |
| Auth             | JWT via `@nestjs/jwt` + `passport-jwt` + JwtAuthGuard            |
| Password hashing | Argon2                                                            |
| Messaging        | Twilio (WhatsApp + SMS)                                           |
| Email            | Resend + React Email                                              |
| Payments         | Stripe                                                            |
| AI               | OpenAI (gpt-4o-mini)                                             |
| Scraping         | Apify (Google Maps reviews)                                       |
| Validation       | class-validator + class-transformer (DTOs)                        |
| Scheduling       | `@nestjs/schedule` (`@Cron` decorators)                          |
| Deployment       | Render (backend) + Vercel (frontend)                              |

---

## Architecture

### Two Prisma Clients

The backend maintains two separate PostgreSQL databases, mirroring the Express app's two MongoDB connections:

| Client | Schema file | Service class | Purpose |
|--------|-------------|---------------|---------|
| `RiseReviewPrismaService` | `prisma/rise-review/rise-review.schema.prisma` | `src/modules/prisma/rise-review/` | All SaaS data (users, campaigns, reviews, etc.) |
| `InternalPrismaService` | `prisma/internal/internal.schema.prisma` | `src/modules/prisma/internal/` | Internal data (leads, admin auth) |

Always inject the correct service; never use the wrong client for the wrong data domain.

### Module Pattern

Every feature is a NestJS module (`@Module`). The standard structure for each domain module:

```
src/modules/<domain>/
├── <domain>.module.ts          # imports, providers, exports
├── <domain>.controller.ts      # @Controller — HTTP endpoints
├── <domain>.service.ts         # @Injectable — business logic
└── dto/
    ├── create-<domain>.dto.ts
    └── update-<domain>.dto.ts
```

Import every domain module into `app.module.ts`. Do not leave business logic in controllers.

### Generated Prisma Types

Prisma clients are generated into `src/generated/`:
- `src/generated/rise-review/` — User, Customer, Campaign, CampaignRecipient, Review, Activity, Feedback + all enums
- `src/generated/internal/` — Admin, Lead, LeadHistory + LeadAction enum

Always import entity types from `../generated/rise-review` or `../generated/internal`, not from `@prisma/client`.

After any schema change, run `npx prisma generate` to regenerate types.

### Guard Stack (equivalent to Express middleware chain)

```
JwtAuthGuard → PlanGuard (on protected routes) → AdminGuard (admin-only routes)
```

Apply guards via decorators — **never** use `app.use()` in `main.ts` for auth:

```typescript
@UseGuards(JwtAuthGuard)                              // authenticated routes
@UseGuards(JwtAuthGuard, PlanGuard)                   // + plan check
@UseGuards(JwtAuthGuard, AdminGuard)                  // admin-only
@RequirePlan('growth')                                // alongside PlanGuard
```

`PlanGuard` always comes after `JwtAuthGuard`. `AdminGuard` replaces `PlanGuard` on admin routes.

### Authentication Flow

Identical to the Express version:
1. Frontend authenticates via NextAuth and receives a JWT signed with `JWT_SECRET`
2. The JWT is sent as `Authorization: Bearer <token>` on every protected request
3. `JwtAuthGuard` verifies the token via `passport-jwt` and populates `req.user`
4. `req.user` has shape `{ id: number, role: string }`

Note: In PostgreSQL, user IDs are `number` (autoincrement integer), not `string | ObjectId` as in MongoDB. No `.toString()` needed.

### Plan Guard

`PlanGuard` + `@RequirePlan()` mirror Express `planGuard(db, tier)`. Access rules are identical:
- Active trial → full Growth access
- Active subscription (Growth/Enterprise) → full access
- Expired trial + no subscription → 403, hard paywall
- No degraded free tier

### DTO Validation

All incoming request bodies must be validated via class-validator DTOs. Apply `ValidationPipe` globally in `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```

Never validate with inline Zod inside controllers — DTOs are the pattern here.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/main.ts` | NestJS bootstrap, global pipes, CORS, prefix |
| `src/app.module.ts` | Root module — imports all domain modules |
| `src/cron/cron.service.ts` | All scheduled jobs (`@Cron` decorators) |
| `src/common/guards/jwt-auth.guard.ts` | JWT verification |
| `src/common/guards/plan.guard.ts` | Subscription tier check |
| `src/common/guards/admin.guard.ts` | Admin-only access |
| `src/common/decorators/require-plan.decorator.ts` | `@RequirePlan()` metadata decorator |
| `src/modules/prisma/rise-review/prisma.service.ts` | RiseReview DB client |
| `src/modules/prisma/internal/prisma.service.ts` | Internal DB client |
| `src/modules/email/email.service.ts` | Resend email sending |
| `src/modules/outreach/outreach.service.ts` | Lead outreach emails |
| `src/modules/campaign/campaign.service.ts` | Campaign sending logic |
| `src/modules/review-request/review-request.service.ts` | Review scraping + auto-response |
| `src/modules/integrations/` | CoverManager, OpenTable, Twilio services |
| `src/common/helpers/` | Shared utilities (enrichment, CSV, tokens, etc.) |
| `src/common/mappers/` | Data transformation (Prisma → response shape) |
| `prisma/rise-review/rise-review.schema.prisma` | SaaS DB schema |
| `prisma/internal/internal.schema.prisma` | Internal DB schema |

---

## Prisma Schema Notes

### Key Differences from MongoDB

| Aspect | Mongoose (Express) | Prisma (NestJS) |
|--------|-------------------|-----------------|
| IDs | `ObjectId` (string) | `Int` (autoincrement) |
| Embedded docs | Nested subdocuments | `Json?` fields (googleBusiness, twilioIntegration, etc.) |
| Arrays of strings | Native arrays | `String[]` |
| Relations | Manual `.populate()` | Typed FK + `@relation()` — auto-joined |
| Enums | String literals | Prisma `enum` types (type-safe) |
| Timestamps | `{ timestamps: true }` | `@default(now())` + `@updatedAt` |

### JSON Fields on User

These User fields are stored as `Json?` in PostgreSQL (not typed columns):
- `googleBusiness` — Google Business Profile config + OAuth tokens
- `googleVerification` — verification state
- `twilioIntegration` — per-user Twilio subaccount + WhatsApp sender
- `onboardingData` — wizard progress state
- `notificationPreferences` — email/SMS notification config

Use the types in `src/common/types/` when reading/writing these fields. The `user.mapper.ts` handles the conversion.

### isOnTrial

In the Express backend, `isOnTrial` is computed by a Mongoose pre-save hook. In the NestJS backend, this field must be computed and set explicitly whenever trial or subscription state changes — Prisma has no lifecycle hooks. Always recalculate before calling `prisma.user.update()` on subscription-related fields.

---

## Cron Jobs

All cron jobs live in `src/cron/cron.service.ts` as `@Cron`-decorated methods on `CronService`. The `CronService` is registered in `AppModule` and receives all dependent services via constructor injection.

The eight required jobs (ported from `../backend/cronJob.ts`):

| Job | Schedule | Express equivalent |
|-----|----------|--------------------|
| Enrich pending leads | Every minute | `enrichPendingLeads` |
| Send outreach emails | Every 2 minutes | `sendOutreachEmails` |
| Send follow-up emails | Every 2 days at 10 AM | `sendFollowUpEmails` |
| Check & dispatch scheduled campaigns | Every minute | campaign scheduler |
| Scrape reviews + auto-respond | Every 10 minutes | `scrapeAndSaveReviews` + `handleAutoResponse` |
| Sync CoverManager + OpenTable reservations | Every 30 minutes | `syncReservations` |
| Send daily performance reports | Daily at midnight | `sendDailyReports` |
| Send weekly reports | Weekly | `sendWeeklyReports` |

---

## Stripe Integration

### Webhook

The Stripe webhook endpoint must receive a **raw body** for signature verification. In `main.ts`, apply `RawBodyMiddleware` (or use `bodyParser.raw`) **before** `express.json()` and only for the webhook route:

```typescript
// main.ts
app.use('/api/rise-review/stripe/webhook', express.raw({ type: 'application/json' }));
```

Webhook secret lives in `STRIPE_WEBHOOK_SECRET`. Signature verification is never skipped.

### Plan Mapping

```
STRIPE_PRICE_GROWTH_MONTHLY / STRIPE_PRICE_GROWTH_ANNUAL → "growth"
STRIPE_PRICE_ENTERPRISE → "enterprise"
null / unknown → null (treated as starter/inactive)
```

---

## Review Response Route

The review response endpoint (customer taps a link from a campaign message) is **public** — no `JwtAuthGuard`, no `PlanGuard`. It reads a signed JWT from the `t` query param, determines verdict (positive/negative), and redirects. Never add auth guards to this route.

---

## SMS Rate Limiting

Rate limits on SMS sends in the onboarding flow (matching the Express backend):
- **60-second cooldown** between any two sends per user
- **5 SMS per day** per user (24h rolling window)

These limits are enforced in the Onboarding service/controller. Never call Twilio for SMS outside of this rate-limited path.

---

## WhatsApp Propagation Delay

After a WhatsApp number is connected via Twilio, Meta requires up to 12 hours before it can send messages. The campaign sending logic must check `twilioIntegration.connectedAt` and throw an appropriate error if the number isn't ready. The campaign controller catches this and saves the campaign as draft.

---

## GPT Message Generation

`ai.service.ts` in `src/modules/review-request/services/` wraps OpenAI:
- Generates review request messages in the specified language (BCP-47 code)
- Both system and user prompts instruct GPT to write in the target language
- Falls back to a hardcoded English message after retry exhaustion
- Never include review links in the GPT prompt — links are appended after generation

---

## Non-Negotiable Rules

1. Always inject `RiseReviewPrismaService` or `InternalPrismaService` — never instantiate Prisma clients directly.
2. Stripe webhook signature verification is never skipped.
3. The Stripe webhook route must use raw body parsing and be configured before `express.json()` in `main.ts`.
4. Never call Twilio for SMS outside the rate-limited helpers in the Onboarding service.
5. Prices are never trusted from the frontend — always use Stripe price IDs mapped server-side.
6. `PlanGuard` always comes after `JwtAuthGuard` in the guard chain.
7. Admin routes always use both `JwtAuthGuard` and `AdminGuard`.
8. The review response route stays public — never add auth guards to it.
9. User IDs are `number` in PostgreSQL — no `.toString()` needed.
10. Never read or print environment variable values into output. Reference names only.
11. Use `this.logger` (NestJS `Logger`) — never use bare `console.log` in production paths.
12. `isOnTrial` is **not** auto-computed by Prisma — calculate and set it explicitly before any subscription update.
13. Import entity types from `src/generated/rise-review` or `src/generated/internal`, not from `@prisma/client`.
14. All controller inputs must go through class-validator DTOs — no inline Zod in controllers.
15. Never leave a domain module unregistered in `app.module.ts`.

---

## Environment Variables

```
# Server
PORT
NODE_ENV

# Database
INTERNAL_DATABASE_URL
RISE_REVIEW_DATABASE_URL

# Auth
JWT_SECRET

# Twilio
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_GROWTH_MONTHLY
STRIPE_PRICE_GROWTH_ANNUAL

# OpenAI
OPENAI_API_KEY

# Resend
RESEND_API_KEY

# Apify
APIFY_API_TOKEN

# Google
GOOGLE_PLACE_API_KEY

# URLs
PUBLIC_URL        # Backend public URL (used in review response links)
FRONTEND_URL      # Frontend URL (used in redirect URLs)
```

---

## Translation Status

**Source:** `../backend` (Express + MongoDB + Mongoose)
**Target:** this repo (NestJS + PostgreSQL + Prisma)

| Area | Status |
|------|--------|
| Prisma schemas (both DBs) | Done |
| Prisma services | Done |
| Email service (Resend) | Done |
| Outreach service | Done |
| Auth guards | Done |
| Plan guard + decorator | Done |
| Admin guard | Done |
| Common helpers | Done |
| Campaign service (sending logic) | Partial |
| Review-request service (scraping, auto-respond) | Partial |
| Integration services (CoverManager, OpenTable, Twilio) | Partial |
| Cron service | Skeleton only |
| Campaign module (controller + full CRUD) | Not started |
| Customer module | Not started |
| Review module | Not started |
| Feedback module | Not started |
| Profile module | Not started |
| Onboarding module | Not started |
| Platform module | Not started |
| Dashboard module | Not started |
| Notification module | Not started |
| Google Business module | Not started |
| Stripe module | Not started |
| Internal: Auth module (admin login) | Not started |
| Internal: Lead module | Not started |
| Internal: Enrichment module | Not started |
| AppModule wiring | Not started |
| Global ValidationPipe + ExceptionFilter | Not started |
| DTOs for all modules | Not started |
