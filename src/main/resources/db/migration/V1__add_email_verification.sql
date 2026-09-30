DO $$
BEGIN
    IF to_regclass('users') IS NOT NULL THEN
        ALTER TABLE users
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS email_verification_otp_hash VARCHAR(100),
            ADD COLUMN IF NOT EXISTS email_verification_otp_expires_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS email_verification_otp_attempts INTEGER NOT NULL DEFAULT 0;
    END IF;
END
$$;