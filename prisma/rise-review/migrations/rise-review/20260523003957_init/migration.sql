-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('starter', 'growth', 'enterprise');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('google', 'opentable', 'covermanager');

-- CreateEnum
CREATE TYPE "FeedbackChannel" AS ENUM ('whatsapp', 'sms', 'email');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('email', 'whatsapp');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'pending', 'sent', 'paused');

-- CreateEnum
CREATE TYPE "CampaignTargetGroup" AS ENUM ('all', 'recent', 'vip', 'hasNoReview', 'positiveOnly', 'allNoReview', 'pastWeekNoReview', 'pastMonthNoReview');

-- CreateEnum
CREATE TYPE "CampaignTiming" AS ENUM ('SEVEN_DAYS', 'THREE_WEEKS', 'ONE_MONTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('message_sent', 'customer_reply', 'ai_response', 'review', 'system', 'campaign', 'reservation');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('pending', 'sent', 'replied', 'approved', 'intercepting');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('positive', 'negative');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "language" TEXT NOT NULL DEFAULT 'es',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "verificationToken" TEXT,
    "verificationTokenExpires" TIMESTAMP(3),
    "trialStartDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "isOnTrial" BOOLEAN NOT NULL DEFAULT false,
    "trialEmailCount" INTEGER NOT NULL DEFAULT 0,
    "trialEmailWindowStart" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
    "subscriptionPlan" "SubscriptionPlan",
    "subscriptionCurrentPeriodEnd" TIMESTAMP(3),
    "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "businessUrl" TEXT,
    "googleBusiness" JSONB,
    "googleVerification" JSONB,
    "twilioIntegration" JSONB,
    "covermanagerConnected" BOOLEAN NOT NULL DEFAULT false,
    "theForkConnected" BOOLEAN NOT NULL DEFAULT false,
    "openTableConnected" BOOLEAN NOT NULL DEFAULT false,
    "doctolibConnected" BOOLEAN NOT NULL DEFAULT false,
    "funnelConfigured" BOOLEAN NOT NULL DEFAULT false,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "onboardingData" JSONB,
    "notificationPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "source" "ReviewSource" NOT NULL,
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "responseText" TEXT,
    "reviewerName" TEXT,
    "reviewDate" TIMESTAMP(3),
    "reviewUrl" TEXT,
    "sentNotification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "lastVisitDate" TIMESTAMP(3),
    "hasReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "channel" "FeedbackChannel" NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CampaignChannel" NOT NULL DEFAULT 'email',
    "platforms" TEXT[] DEFAULT ARRAY['google']::TEXT[],
    "targetGroup" "CampaignTargetGroup" NOT NULL DEFAULT 'hasNoReview',
    "timing" "CampaignTiming" NOT NULL DEFAULT 'SEVEN_DAYS',
    "language" TEXT NOT NULL DEFAULT 'en',
    "reviewLinks" JSONB,
    "date" TIMESTAMP(3),
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "tone" TEXT,
    "message" TEXT,
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "excluded" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "responded" INTEGER NOT NULL DEFAULT 0,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "useGPT" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "included" BOOLEAN NOT NULL,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "ActivityType" NOT NULL,
    "sourceId" TEXT,
    "sourceCustomerId" TEXT,
    "platform" TEXT,
    "customer" TEXT,
    "rating" TEXT,
    "preview" TEXT,
    "status" "ActivityStatus",
    "interceptedRating" INTEGER,
    "verdict" "Verdict",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Review_userId_responded_idx" ON "Review"("userId", "responded");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_reviewerName_reviewDate_key" ON "Review"("userId", "reviewerName", "reviewDate");

-- CreateIndex
CREATE INDEX "Customer_userId_idx" ON "Customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_email_key" ON "Customer"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_phone_key" ON "Customer"("userId", "phone");

-- CreateIndex
CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Feedback_userId_read_idx" ON "Feedback"("userId", "read");

-- CreateIndex
CREATE INDEX "Campaign_userId_idx" ON "Campaign"("userId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "CampaignRecipient_campaignId_idx" ON "CampaignRecipient"("campaignId");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
