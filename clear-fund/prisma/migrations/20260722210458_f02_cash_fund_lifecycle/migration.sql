-- CreateEnum
CREATE TYPE "CashFundStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "cash_fund" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoKey" TEXT,
    "phrase" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "monthlySavingAmount" DECIMAL(18,2) NOT NULL,
    "officialStartDate" DATE,
    "status" "CashFundStatus" NOT NULL DEFAULT 'DRAFT',
    "nextMemberNumber" INTEGER NOT NULL DEFAULT 1,
    "recommendedDay" INTEGER NOT NULL,
    "maximumDay" INTEGER NOT NULL,
    "maxAdvanceMonths" INTEGER NOT NULL,
    "riskThreshold" INTEGER NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_fund_user" (
    "id" TEXT NOT NULL,
    "cashFundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_fund_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_fund_status_idx" ON "cash_fund"("status");

-- CreateIndex
CREATE INDEX "cash_fund_user_userId_idx" ON "cash_fund_user"("userId");

-- CreateIndex
CREATE INDEX "cash_fund_user_cashFundId_idx" ON "cash_fund_user"("cashFundId");

-- CreateIndex
CREATE UNIQUE INDEX "cash_fund_user_cashFundId_userId_key" ON "cash_fund_user"("cashFundId", "userId");

-- AddForeignKey
ALTER TABLE "cash_fund_user" ADD CONSTRAINT "cash_fund_user_cashFundId_fkey" FOREIGN KEY ("cashFundId") REFERENCES "cash_fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_fund_user" ADD CONSTRAINT "cash_fund_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckConstraints (F02: amount and day guards — PRISMA_SCHEMA_PLAN.md)
ALTER TABLE "cash_fund" ADD CONSTRAINT "cash_fund_monthly_saving_positive" CHECK ("monthlySavingAmount" > 0);
ALTER TABLE "cash_fund" ADD CONSTRAINT "cash_fund_recommended_day_range" CHECK ("recommendedDay" BETWEEN 1 AND 28);
ALTER TABLE "cash_fund" ADD CONSTRAINT "cash_fund_maximum_day_range" CHECK ("maximumDay" BETWEEN 1 AND 28);
ALTER TABLE "cash_fund" ADD CONSTRAINT "cash_fund_recommended_le_maximum" CHECK ("recommendedDay" <= "maximumDay");
ALTER TABLE "cash_fund" ADD CONSTRAINT "cash_fund_max_advance_nonneg" CHECK ("maxAdvanceMonths" >= 0);
ALTER TABLE "cash_fund" ADD CONSTRAINT "cash_fund_risk_threshold_nonneg" CHECK ("riskThreshold" >= 0);
