-- V6: Add address fields to kabadi_walas table
ALTER TABLE kabadi_walas
    ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(200),
    ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(200),
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(6);

-- Add lat/lng columns if not present (added via Hibernate but may be missing in DB)
ALTER TABLE kabadi_walas
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
