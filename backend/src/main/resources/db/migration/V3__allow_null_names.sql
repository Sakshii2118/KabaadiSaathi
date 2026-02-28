-- V3: Allow NULL names on users and kabadi_walas
-- Users and kabadi-walas are created with only mobile+OTP during send-otp,
-- name is only populated after OTP verification + registration step.

ALTER TABLE users ALTER COLUMN name DROP NOT NULL;
ALTER TABLE kabadi_walas ALTER COLUMN name DROP NOT NULL;
