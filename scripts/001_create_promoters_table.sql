CREATE TABLE IF NOT EXISTS promoters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    id_card_number TEXT NOT NULL,
    id_card_url TEXT,
    passport_url TEXT,
    employer_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    outsourced_to_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    job_title TEXT,
    work_location TEXT,
    status TEXT DEFAULT 'active',
    contract_valid_until DATE,
    id_card_expiry_date DATE,
    passport_expiry_date DATE,
    notify_days_before_id_expiry INTEGER DEFAULT 30,
    notify_days_before_passport_expiry INTEGER DEFAULT 90,
    notify_days_before_contract_expiry INTEGER DEFAULT 30,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promoters_employer_id ON promoters(employer_id);
CREATE INDEX IF NOT EXISTS idx_promoters_outsourced_to_id ON promoters(outsourced_to_id);
