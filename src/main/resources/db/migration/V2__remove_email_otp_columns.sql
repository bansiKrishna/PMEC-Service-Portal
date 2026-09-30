DO $$
BEGIN
    IF to_regclass('users') IS NOT NULL THEN
        ALTER TABLE users
            DROP COLUMN IF EXISTS email_verification_otp_hash,
            DROP COLUMN IF EXISTS email_verification_otp_expires_at,
            DROP COLUMN IF EXISTS email_verification_otp_attempts;
    END IF;
END
$$;