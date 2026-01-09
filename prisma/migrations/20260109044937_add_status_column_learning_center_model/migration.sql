-- AlterTable
ALTER TABLE "LearningCenter" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active',
ALTER COLUMN "modifiedOn" DROP DEFAULT;
