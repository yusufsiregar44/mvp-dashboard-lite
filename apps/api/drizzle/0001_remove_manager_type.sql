-- Migration to remove manager_type column from user_managers table
-- This migration:
-- 1. Drops the existing primary key constraint
-- 2. Removes the manager_type column
-- 3. Creates a new primary key constraint with just user_id and manager_id

-- Step 1: Drop the existing primary key constraint
ALTER TABLE "user_managers" DROP CONSTRAINT "user_managers_pkey";

-- Step 2: Remove the manager_type column
ALTER TABLE "user_managers" DROP COLUMN "manager_type";

-- Step 3: Create new primary key constraint with user_id and manager_id only
ALTER TABLE "user_managers" ADD CONSTRAINT "user_managers_user_id_manager_id_pk" PRIMARY KEY("user_id", "manager_id");
