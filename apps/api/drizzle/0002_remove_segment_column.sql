-- Migration to remove segment column from resources table
-- This migration removes the segment column as it's no longer needed

-- Remove the segment column from resources table
ALTER TABLE "resources" DROP COLUMN "segment";
