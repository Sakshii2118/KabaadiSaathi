-- V5: Delete the admin row inserted by V1/V4 (which had an incorrect/unknown bcrypt hash).
-- DataSeeder runs on every application startup and will re-create the admin row
-- using Spring Security's passwordEncoder.encode("admin123"), guaranteeing a correct hash.
DELETE FROM admins WHERE username = 'admin';
