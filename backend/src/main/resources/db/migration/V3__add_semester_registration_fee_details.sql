DO $$
BEGIN
    IF to_regclass('semester_registrations') IS NOT NULL THEN
        ALTER TABLE semester_registrations
            ADD COLUMN college_fee_due NUMERIC(12, 2),
            ADD COLUMN college_fee_paid NUMERIC(12, 2),
            ADD COLUMN college_advance NUMERIC(12, 2),
            ADD COLUMN hostel_fee_due NUMERIC(12, 2),
            ADD COLUMN hostel_fee_paid NUMERIC(12, 2),
            ADD COLUMN hostel_advance NUMERIC(12, 2),
            ADD COLUMN mess_fee_due NUMERIC(12, 2),
            ADD COLUMN mess_fee_paid NUMERIC(12, 2),
            ADD COLUMN mess_advance NUMERIC(12, 2);
    END IF;
END;
$$;
