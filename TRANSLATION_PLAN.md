# Translation Plan: Express/MongoDB → NestJS/PostgreSQL

Source: `../backend` (Express + Mongoose)
Target: `rise-review-nestjs-backend` (NestJS + Prisma)

Current completion: ~40%

---

## Phase 0 — Bootstrap (do this first, unlocks everything else)

**Goal:** Make the app bootable with all modules wired, global pipes, and proper CORS.

### 0.1 Wire `main.ts`

```typescript
// Add to main.ts before app.listen():
app.setGlobalPrefix('api');
app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
app.use('/api/rise-review/stripe/webhook', express.raw({ type: 'application/json' }));
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
app.useGlobalFilters(new HttpExceptionFilter());
```

### 0.2 Create `HttpExceptionFilter`

File: `src/common/filters/http-exception.filter.ts`

Catches all `HttpException`s and formats them as `{ statusCode, message, error }`. Also catches unknown errors and returns 500.

Source reference: Express controllers use try/catch with `res.status(500).json(...)` — centralise that here.

### 0.3 Wire `AppModule`

Import order matters — Prisma modules first, then feature modules, then CronModule last.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Prisma
    RiseReviewPrismaModule,
    InternalPrismaModule,
    // Internal (admin dashboard)
    AdminAuthModule,
    LeadModule,
    EnrichmentModule,
    // Rise-Review SaaS
    UserModule,          // profile, onboarding, business info, notifications
    CampaignModule,
    CustomerModule,
    ReviewModule,
    FeedbackModule,
    PlatformModule,
    DashboardModule,
    OnboardingModule,
    GoogleBusinessModule,
    IntegrationsModule,  // re-exports CoverManager, OpenTable, Twilio
    StripeModule,
    ReviewResponseModule, // public — no guards
    // Infrastructure
    EmailModule,
    OutreachModule,
    ReviewRequestModule,
    CronModule,
  ],
})
export class AppModule {}
```

---

## Phase 1 — User Domain (Profile, Onboarding, Business Info, Notifications)

Consolidate into a single `UserModule` with sub-controllers or keep separate modules — either works. Recommend one `UserModule` with multiple controllers.

### Controllers to create

| NestJS controller | Express source | Route prefix |
|-------------------|----------------|--------------|
| `ProfileController` | `profile.controller.ts` | `api/rise-review/profile` |
| `OnboardingController` | `onboarding.controller.ts` | `api/rise-review/onboarding` |
| `BusinessInfoController` | `businessInfo.controller.ts` | `api/rise-review/business-info` |
| `NotificationController` | `notification.controller.ts` | `api/rise-review/notifications` |

### Services to create

- `UserService` — shared Prisma queries (findById, update, etc.)
- `OnboardingService` — wizard steps + SMS rate limiting (60s cooldown, 5/day)
- `ProfileService` — profile read/update, password change, funnel message update
- `NotificationService` — preference read/update

### DTOs

- `UpdateProfileDto`
- `ChangePasswordDto`
- `UpdateOnboardingDto`
- `UpdateNotificationPreferencesDto`
- `StartVerificationDto` / `ResendVerificationDto` (include SMS rate-limit enforcement in service)

### isOnTrial note

Whenever subscription fields change, compute `isOnTrial` explicitly:

```typescript
const isOnTrial = user.trialEndDate
  ? new Date() < new Date(user.trialEndDate)
  : false;
await prisma.user.update({ where: { id }, data: { isOnTrial, ...otherFields } });
```

---

## Phase 2 — Campaign Module

**Highest complexity.** Has the most endpoints and the sending logic is partially done.

### 2.1 Finish `CampaignService`

Source: `../backend/controllers/rise-review/campaign.controller.ts`

Methods needed:
- `createCampaign(userId, dto)` — validate plan limits (starter cap), build recipients list
- `getCampaigns(userId)` — list with metrics
- `getCampaignById(userId, id)` — single campaign
- `updateCampaign(userId, id, dto)` — patch fields
- `deleteCampaign(userId, id)`
- `startCampaign(userId, id)` — triggers `sendCampaignMessages` from existing service
- `pauseCampaign(userId, id)` — sets status = paused
- `resumeCampaign(userId, id)` — re-queues
- `getCampaignVerdicts(userId, id)` — activity verdict stats

### 2.2 Create `CampaignController`

```typescript
@Controller('api/rise-review/campaigns')
@UseGuards(JwtAuthGuard, PlanGuard)
export class CampaignController { ... }
```

Endpoints:
```
POST   /                    createCampaign     — @RequirePlan('starter')
GET    /                    getCampaigns
GET    /:id                 getCampaignById
PATCH  /:id                 updateCampaign
DELETE /:id                 deleteCampaign
POST   /:id/start           startCampaign      — @RequirePlan('starter')
PATCH  /:id/pause           pauseCampaign
PATCH  /:id/resume          resumeCampaign
GET    /:id/verdicts        getCampaignVerdicts
```

### 2.3 DTOs

- `CreateCampaignDto` — channel, name, platforms, targetGroup, timing, language, tone?, message?, useGPT, date?, isScheduled
- `UpdateCampaignDto` — `PartialType(CreateCampaignDto)`

---

## Phase 3 — Customer Module

Source: `../backend/controllers/rise-review/customer.controller.ts`

### `CustomerController` endpoints

```
POST   /api/rise-review/customers                  createCustomer
GET    /api/rise-review/customers                  getCustomers
GET    /api/rise-review/customers/:id              getCustomerById
PATCH  /api/rise-review/customers/:id              updateCustomer
DELETE /api/rise-review/customers/:id              deleteCustomer
POST   /api/rise-review/customers/import           importCSV (multipart)
```

### `CustomerService` methods

- `createCustomer(userId, dto)`
- `getCustomers(userId, query)` — supports pagination/search
- `importCSV(userId, file)` — uses `csv-parser.helper.ts`, bulk upsert

### DTOs

- `CreateCustomerDto` — name, email?, phone?, lastVisitDate?
- `UpdateCustomerDto` — PartialType

---

## Phase 4 — Review Module

Source: `../backend/controllers/rise-review/review.controller.ts`

### `ReviewController` endpoints

```
GET    /api/rise-review/reviews                    getReviews
POST   /api/rise-review/reviews/scrape             triggerScrape    — @RequirePlan('growth')
POST   /api/rise-review/reviews/:id/respond        respondToReview  — @RequirePlan('growth')
```

### `ReviewService` methods

- `getReviews(userId, query)` — filter by source, rating, responded
- `triggerScrape(userId)` — calls `ReviewRequestService.scrapeAndSaveReviews`
- `respondToReview(userId, reviewId, text)` — update + post to Google API

---

## Phase 5 — Review Response Route (Public)

Source: `../backend/controllers/rise-review/reviewResponse.controller.ts`
Source: `../backend/routes/rise-review/reviewResponse.route.ts`

**This route has no auth guards.** It's a redirect endpoint for customers.

### `ReviewResponseController`

```
GET /api/rise-review/review-response   — no guards, reads ?t= JWT param
```

Uses `review-token.helper.ts` to verify the JWT, logs activity, redirects to positive/negative URL.

---

## Phase 6 — Feedback Module

Source: `../backend/controllers/rise-review/feedback.controller.ts`

### `FeedbackController` endpoints

```
GET    /api/rise-review/feedback          getFeedback
PATCH  /api/rise-review/feedback/:id/read markAsRead
DELETE /api/rise-review/feedback/:id      deleteFeedback
```

### `FeedbackService`

- `getFeedback(userId, query)` — unread count, paginated list
- `markAsRead(userId, id)`
- `deleteFeedback(userId, id)`

---

## Phase 7 — Dashboard Module

Source: `../backend/controllers/rise-review/dashboard.controller.ts`

### `DashboardController` endpoints

```
GET /api/rise-review/dashboard           getDashboardStats
```

### `DashboardService`

- Aggregate: review counts by source/rating, campaign metrics, recent activity
- All queries go to `RiseReviewPrismaService`

---

## Phase 8 — Platform Module

Source: `../backend/controllers/rise-review/platform.controller.ts`

Configuration endpoints (Google Business URL, platform toggles).

```
GET    /api/rise-review/platform          getPlatformConfig
PATCH  /api/rise-review/platform          updatePlatformConfig
```

---

## Phase 9 — Integrations Module

Three sub-modules already partially built. Need controllers and wire-up.

### 9.1 CoverManager

Source: `../backend/controllers/rise-review/coverManager.controller.ts`
Service: `src/modules/integrations/cover-manager/cover-manager.service.ts` (partial)

```
POST   /api/rise-review/integrations/cover-manager/connect     connect
DELETE /api/rise-review/integrations/cover-manager/disconnect  disconnect
POST   /api/rise-review/integrations/cover-manager/webhook     webhook (public)
```

### 9.2 OpenTable

Source: `../backend/controllers/rise-review/openTable.controller.ts`
Service: `src/modules/integrations/open-table/open-table.service.ts` (partial)

```
POST   /api/rise-review/integrations/open-table/connect
DELETE /api/rise-review/integrations/open-table/disconnect
```

### 9.3 Twilio / WhatsApp

Source: `../backend/controllers/rise-review/twilioMessaging.controller.ts`
Service: `src/modules/integrations/twilio/twilio.service.ts`

```
POST   /api/rise-review/integrations/twilio/connect-whatsapp
POST   /api/rise-review/integrations/twilio/webhook          (public — Twilio sends to this)
GET    /api/rise-review/integrations/twilio/status
```

---

## Phase 10 — Google Business Module

Source: `../backend/controllers/rise-review/businessInfo.controller.ts` + `integrations.controller.ts`

OAuth flow + verification + listing management.

```
GET    /api/rise-review/google/auth-url          getOAuthUrl
GET    /api/rise-review/google/callback          handleOAuthCallback  (public redirect)
GET    /api/rise-review/google/locations         getLocations
POST   /api/rise-review/google/verify            verifyBusiness
GET    /api/rise-review/google/status            getVerificationStatus
DELETE /api/rise-review/google/disconnect        disconnect
```

---

## Phase 11 — Stripe Module

Source: `../backend/controllers/rise-review/stripe.controller.ts`

### Critical: raw body for webhook

Must be configured in `main.ts` BEFORE `express.json()`:
```typescript
app.use('/api/rise-review/stripe/webhook', express.raw({ type: 'application/json' }));
```

### `StripeController` endpoints

```
POST   /api/rise-review/stripe/create-checkout     createCheckout
POST   /api/rise-review/stripe/create-portal       createPortal
GET    /api/rise-review/stripe/subscription         getSubscription
POST   /api/rise-review/stripe/webhook              handleWebhook  (raw body, public)
```

### `StripeService` methods

- `createCheckoutSession(userId, priceId)`
- `createPortalSession(userId)`
- `getSubscription(userId)`
- `handleWebhook(rawBody, signature)` — verifies sig, handles `customer.subscription.*` events, updates User
- `mapPriceToPlan(priceId)` — maps Stripe price IDs to `SubscriptionPlan` enum

---

## Phase 12 — Internal Domain (Admin, Lead, Enrichment)

Source: `../backend/controllers/internal/`

Uses `InternalPrismaService`.

### 12.1 AdminAuth Module

```
POST   /api/internal/auth/register
POST   /api/internal/auth/login
GET    /api/internal/auth/profile   — @UseGuards(JwtAuthGuard, AdminGuard)
```

AdminGuard validates `req.user.role === 'admin'`.

### 12.2 Lead Module

```
GET    /api/internal/leads
POST   /api/internal/leads
PATCH  /api/internal/leads/:id
DELETE /api/internal/leads/:id
POST   /api/internal/leads/import   — CSV bulk import
GET    /api/internal/leads/:id/history
```

### 12.3 Enrichment Module

```
POST   /api/internal/enrichment/enrich-single   — enriches one lead
POST   /api/internal/enrichment/bulk            — triggers bulk enrichment
```

Uses `bulk-enrichment.helper.ts` and `google-rating.helper.ts`.

### 12.4 Email Tracking (internal)

```
GET    /api/internal/email/pixel/:token         — open pixel (public)
GET    /api/internal/email/unsubscribe/:token   — unsubscribe link (public)
POST   /api/internal/email/track-click/:id      — click tracking
```

---

## Phase 13 — Cron Service (implement all 8 jobs)

Source: `../backend/cronJob.ts`

File: `src/cron/cron.service.ts` (skeleton exists, needs full implementation)

```typescript
@Cron('* * * * *')                               // every minute
async enrichLeads() { ... }

@Cron('*/2 * * * *')                             // every 2 minutes
async sendOutreach() { ... }

@Cron('0 10 */2 * *')                            // every 2 days at 10 AM
async sendFollowUps() { ... }

@Cron('* * * * *')                               // every minute
async dispatchScheduledCampaigns() { ... }

@Cron('*/10 * * * *')                            // every 10 minutes
async scrapeAndAutoRespond() { ... }

@Cron('*/30 * * * *')                            // every 30 minutes
async syncReservations() { ... }

@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async sendDailyReports() { ... }

@Cron(CronExpression.EVERY_WEEK)
async sendWeeklyReports() { ... }
```

Each method should catch its own errors and log them with `this.logger.error(...)` so one failure doesn't kill the others.

---

## Phase 14 — Final Hardening

1. **Global ExceptionFilter** — `src/common/filters/http-exception.filter.ts` (Phase 0, but verify)
2. **Logging interceptor** — `src/common/interceptors/logging.interceptor.ts` — logs method, url, status, duration
3. **Swagger** — `@nestjs/swagger` with `@ApiProperty()` on all DTOs (optional, nice to have)
4. **e2e tests** — at least smoke tests for auth + campaign endpoints
5. **`main.ts` hardening** — verify cookie-parser, CORS, prefix, raw body, validation pipe are all wired

---

## Completion Checklist

- [ ] Phase 0 — Bootstrap (main.ts, AppModule, ExceptionFilter)
- [ ] Phase 1 — User domain (Profile, Onboarding, BusinessInfo, Notifications)
- [ ] Phase 2 — Campaign module (full CRUD + send/pause/resume)
- [ ] Phase 3 — Customer module (CRUD + CSV import)
- [ ] Phase 4 — Review module (list + scrape + respond)
- [ ] Phase 5 — Review Response route (public redirect)
- [ ] Phase 6 — Feedback module
- [ ] Phase 7 — Dashboard module
- [ ] Phase 8 — Platform module
- [ ] Phase 9 — Integrations (CoverManager, OpenTable, Twilio)
- [ ] Phase 10 — Google Business module (OAuth, verification)
- [ ] Phase 11 — Stripe module (checkout, portal, webhook)
- [ ] Phase 12 — Internal domain (AdminAuth, Lead, Enrichment, Email tracking)
- [ ] Phase 13 — Cron service (all 8 jobs implemented)
- [ ] Phase 14 — Final hardening (logging, Swagger, e2e tests)
