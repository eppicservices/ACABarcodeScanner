-- CreateEnum
CREATE TYPE "student_type" AS ENUM ('regular', 'staff_faculty', 'student_unlimited');

-- AlterTable
ALTER TABLE "students" ADD COLUMN "student_type" "student_type" NOT NULL DEFAULT 'regular';
