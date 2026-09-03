-- Add opt-in daily reminder settings to existing users.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS daily_reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS reminder_hour_utc INTEGER NOT NULL DEFAULT 18;

UPDATE users
SET daily_reminder_enabled = FALSE
WHERE daily_reminder_enabled IS NULL;

UPDATE users
SET reminder_hour_utc = 18
WHERE reminder_hour_utc IS NULL;

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS post_text TEXT,
    ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES projects(id);

UPDATE user_project_progress
SET status = 'COMPLETED'
WHERE is_complete = TRUE
  AND (status IS NULL OR status <> 'COMPLETED');
