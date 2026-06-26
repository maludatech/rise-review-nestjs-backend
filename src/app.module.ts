import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Database
import { RiseReviewPrismaModule } from './modules/prisma/rise-review/prisma.module';
import { InternalPrismaModule } from './modules/prisma/internal/prisma.module';

// Shared infrastructure
import { EmailModule } from './modules/email/email.module';
import { OutreachModule } from './modules/outreach/outreach.module';
import { ReviewRequestModule } from './modules/review-request/review-request.module';

// Rise-Review SaaS feature modules
import { UserModule } from './modules/user/user.module';
import { CustomerModule } from './modules/customer/customer.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { ReviewModule } from './modules/review/review.module';
import { ReviewResponseModule } from './modules/review-response/review-response.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PlatformModule } from './modules/platform/platform.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { GoogleModule } from './modules/google/google.module';
import { StripeModule } from './modules/stripe/stripe.module';

// Internal domain
import { AdminAuthModule } from './modules/internal/admin-auth/admin-auth.module';
import { LeadModule } from './modules/internal/lead/lead.module';
import { EnrichmentModule } from './modules/internal/enrichment/enrichment.module';
import { EmailTrackingModule } from './modules/internal/email/email-tracking.module';

// Cron
import { CronModule } from './cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // Database (global — no need to import in feature modules)
    RiseReviewPrismaModule,
    InternalPrismaModule,

    // Shared infrastructure
    EmailModule,

    // Rise-Review SaaS
    UserModule,
    CustomerModule,
    CampaignModule,
    ReviewModule,
    ReviewResponseModule,
    FeedbackModule,
    DashboardModule,
    PlatformModule,
    IntegrationsModule,
    GoogleModule,
    StripeModule,

    // Internal (admin dashboard)
    AdminAuthModule,
    LeadModule,
    EnrichmentModule,
    EmailTrackingModule,

    // Shared services used by cron
    OutreachModule,
    ReviewRequestModule,

    // Cron — last, after all service modules
    CronModule,
  ],
})
export class AppModule {}
