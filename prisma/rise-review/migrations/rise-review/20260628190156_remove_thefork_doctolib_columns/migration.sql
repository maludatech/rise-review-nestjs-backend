/*
  Warnings:

  - You are about to drop the column `doctolibConnected` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `theForkConnected` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "doctolibConnected",
DROP COLUMN "theForkConnected";
