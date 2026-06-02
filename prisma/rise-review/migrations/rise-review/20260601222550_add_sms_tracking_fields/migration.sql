-- AlterTable
ALTER TABLE "User" ADD COLUMN     "smsDailyCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "smsDailyWindowStart" TIMESTAMP(3),
ADD COLUMN     "smsLastSentAt" TIMESTAMP(3);
