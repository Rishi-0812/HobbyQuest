-- Manual migration for admin AI content staging table.
-- Run against PostgreSQL before using the new admin endpoints.

CREATE TABLE IF NOT EXISTS ai_generated_content (
    id BIGSERIAL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL,
    target_hobby_id BIGINT REFERENCES hobbies(id) NULL,
    hobby_name VARCHAR(100) NOT NULL,
    hobby_type VARCHAR(20) NOT NULL,
    raw_json TEXT NOT NULL,
    edited_json TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_by BIGINT REFERENCES users(id) NULL,
    difficulty VARCHAR(20) NULL,
    project_name VARCHAR(150) NULL,
    target_count INTEGER NULL,
    unit_label VARCHAR(70) NULL,
    unit_label_plural VARCHAR(70) NULL,
    duration_days INTEGER NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_content_status ON ai_generated_content(status);
CREATE INDEX IF NOT EXISTS idx_ai_content_type ON ai_generated_content(content_type);

-- Optional one-time migration from legacy roadmap table (safe if table is absent).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ai_generated_roadmaps'
    ) THEN
        INSERT INTO ai_generated_content (
            content_type, target_hobby_id, hobby_name, hobby_type, raw_json, edited_json,
            status, generated_at, reviewed_by
        )
        SELECT
            'roadmap',
            NULL,
            hobby_name,
            hobby_type,
            raw_json,
            edited_json,
            status,
            generated_at,
            reviewed_by
        FROM ai_generated_roadmaps;
    END IF;
END $$;
