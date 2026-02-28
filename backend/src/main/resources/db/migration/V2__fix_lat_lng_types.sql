-- V2: Ensure latitude/longitude columns are DOUBLE PRECISION in all tables
-- This migration is idempotent and handles both upgrade paths

-- Fix bookings lat/lng if they are still NUMERIC/DECIMAL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
          AND column_name = 'latitude'
          AND data_type IN ('numeric', 'decimal')
    ) THEN
        ALTER TABLE bookings
            ALTER COLUMN latitude  TYPE DOUBLE PRECISION USING latitude::DOUBLE PRECISION,
            ALTER COLUMN longitude TYPE DOUBLE PRECISION USING longitude::DOUBLE PRECISION;
        RAISE NOTICE 'Fixed bookings lat/lng to DOUBLE PRECISION';
    ELSE
        RAISE NOTICE 'bookings lat/lng already correct type, skipping';
    END IF;
END $$;

-- Add lat/lng to kabadi_walas if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kabadi_walas' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE kabadi_walas ADD COLUMN latitude  DOUBLE PRECISION;
        ALTER TABLE kabadi_walas ADD COLUMN longitude DOUBLE PRECISION;
        RAISE NOTICE 'Added latitude/longitude to kabadi_walas';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kabadi_walas'
          AND column_name = 'latitude'
          AND data_type IN ('numeric', 'decimal')
    ) THEN
        ALTER TABLE kabadi_walas
            ALTER COLUMN latitude  TYPE DOUBLE PRECISION USING latitude::DOUBLE PRECISION,
            ALTER COLUMN longitude TYPE DOUBLE PRECISION USING longitude::DOUBLE PRECISION;
        RAISE NOTICE 'Fixed kabadi_walas lat/lng to DOUBLE PRECISION';
    ELSE
        RAISE NOTICE 'kabadi_walas lat/lng already correct, skipping';
    END IF;
END $$;
