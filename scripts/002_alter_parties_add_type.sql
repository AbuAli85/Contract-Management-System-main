-- Add a 'type' column to the parties table to distinguish between Employer and Client
-- Ensure this script is idempotent (can be run multiple times without error)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' -- or your specific schema
        AND table_name = 'parties'
        AND column_name = 'type'
    ) THEN
        ALTER TABLE parties
        ADD COLUMN type TEXT; -- Consider ENUM or CHECK constraint for specific values
    END IF;
END $$;

-- Add a CHECK constraint if you want to strictly enforce values (optional, but good practice)
-- This might fail if there's existing data that doesn't conform.
-- Consider updating existing data first or making the constraint more flexible.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'parties'
        AND constraint_name = 'parties_type_check'
    ) THEN
        ALTER TABLE parties
        ADD CONSTRAINT parties_type_check CHECK (type IN ('Employer', 'Client', 'Generic', NULL));
    END IF;
END $$;

COMMENT ON COLUMN parties.type IS 'Type of party, e.g., Employer, Client, or Generic.';
