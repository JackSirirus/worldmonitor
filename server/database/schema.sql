-- WorldMonitor Database Schema
-- PostgreSQL 16

-- ============================================
-- RSS Sources Table
-- ============================================
CREATE TABLE IF NOT EXISTS rss_sources (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    tier INTEGER DEFAULT 4, -- 1=wire, 2=major, 3=specialty, 4=aggregator
    last_fetch TIMESTAMP,
    fetch_interval INTEGER DEFAULT 7200000, -- 2 hours in milliseconds
    status TEXT DEFAULT 'pending', -- 'pending', 'ok', 'warning', 'error'
    error_message TEXT,
    response_time INTEGER, -- milliseconds
    last_checked TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for rss_sources
CREATE INDEX IF NOT EXISTS idx_rss_sources_url ON rss_sources(url);
CREATE INDEX IF NOT EXISTS idx_rss_sources_category ON rss_sources(category);
CREATE INDEX IF NOT EXISTS idx_rss_sources_status ON rss_sources(status);

-- ============================================
-- RSS Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS rss_items (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL REFERENCES rss_sources(url) ON DELETE CASCADE,
    title TEXT NOT NULL,
    link TEXT NOT NULL UNIQUE,
    description TEXT,
    pub_date TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for rss_items
CREATE INDEX IF NOT EXISTS idx_rss_items_link ON rss_items(link);
CREATE INDEX IF NOT EXISTS idx_rss_items_source ON rss_items(source_url);
CREATE INDEX IF NOT EXISTS idx_rss_items_pub_date ON rss_items(pub_date);
CREATE INDEX IF NOT EXISTS idx_rss_items_fetched_at ON rss_items(fetched_at);
CREATE INDEX IF NOT EXISTS idx_rss_items_category ON rss_items(category);

-- Add category column to rss_items if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rss_items' AND column_name = 'category') THEN
        ALTER TABLE rss_items ADD COLUMN category TEXT;
    END IF;
END $$ LANGUAGE plpgsql;

-- Add bilingual support and threat classification columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rss_items' AND column_name = 'title_zh') THEN
        ALTER TABLE rss_items ADD COLUMN title_zh TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rss_items' AND column_name = 'description_zh') THEN
        ALTER TABLE rss_items ADD COLUMN description_zh TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rss_items' AND column_name = 'title_hash') THEN
        ALTER TABLE rss_items ADD COLUMN title_hash TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rss_items' AND column_name = 'cluster_id') THEN
        ALTER TABLE rss_items ADD COLUMN cluster_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rss_items' AND column_name = 'threat_level') THEN
        ALTER TABLE rss_items ADD COLUMN threat_level TEXT DEFAULT 'info';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rss_items' AND column_name = 'threat_category') THEN
        ALTER TABLE rss_items ADD COLUMN threat_category TEXT DEFAULT 'general';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rss_items' AND column_name = 'sentiment_score') THEN
        ALTER TABLE rss_items ADD COLUMN sentiment_score INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rss_items' AND column_name = 'sentiment_label') THEN
        ALTER TABLE rss_items ADD COLUMN sentiment_label TEXT DEFAULT 'neutral';
    END IF;
END $$ LANGUAGE plpgsql;

-- Translation cache table
CREATE TABLE IF NOT EXISTS translation_cache (
    id SERIAL PRIMARY KEY,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    source_lang TEXT NOT NULL,
    target_lang TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source_text, source_lang, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup
ON translation_cache(source_text, source_lang, target_lang);

-- ============================================
-- Agent Tasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS agent_tasks (
    id SERIAL PRIMARY KEY,
    task_type TEXT NOT NULL, -- 'summary', 'trend', 'report', 'podcast'
    status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    params JSONB,
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for agent_tasks
CREATE INDEX IF NOT EXISTS idx_agent_tasks_type ON agent_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON agent_tasks(created_at);

-- ============================================
-- Reports Table
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    format TEXT DEFAULT 'markdown', -- 'markdown', 'pdf', 'html'
    category TEXT,
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    task_id INTEGER REFERENCES agent_tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- ============================================
-- Podcasts Table
-- ============================================
CREATE TABLE IF NOT EXISTS podcasts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    audio_url TEXT,
    audio_path TEXT, -- local file path
    duration INTEGER, -- seconds
    voice TEXT DEFAULT 'en-US-AriaNeural',
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
    task_id INTEGER REFERENCES agent_tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP -- for auto-cleanup
);

-- Indexes for podcasts
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON podcasts(status);
CREATE INDEX IF NOT EXISTS idx_podcasts_expires_at ON podcasts(expires_at);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON podcasts(created_at);

-- ============================================
-- Update Timestamp Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_rss_sources_updated_at
    BEFORE UPDATE ON rss_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_tasks_updated_at
    BEFORE UPDATE ON agent_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Agent Jobs Table (Task Configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_jobs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    schedule TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    execution_mode TEXT DEFAULT 'isolated', -- 'isolated' or 'mainSession'
    payload JSONB NOT NULL,
    max_concurrent INTEGER DEFAULT 1,
    timeout INTEGER DEFAULT 300000,
    retry_policy JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for agent_jobs
CREATE INDEX IF NOT EXISTS idx_agent_jobs_enabled ON agent_jobs(enabled);

-- ============================================
-- Task Logs Table (Append-only Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    level TEXT NOT NULL, -- 'info', 'warn', 'error', 'debug'
    message TEXT NOT NULL,
    context JSONB
);

-- Indexes for task_logs
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_timestamp ON task_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_task_logs_session_id ON task_logs(session_id);

-- ============================================
-- Dead Letter Tasks Table (Failed Tasks)
-- ============================================
CREATE TABLE IF NOT EXISTS dead_letter_tasks (
    id SERIAL PRIMARY KEY,
    original_task_id TEXT NOT NULL,
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    failed_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'pending-review', -- 'pending-review', 'ignored', 'requeued'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for dead_letter_tasks
CREATE INDEX IF NOT EXISTS idx_dead_letter_status ON dead_letter_tasks(status);
CREATE INDEX IF NOT EXISTS idx_dead_letter_failed_at ON dead_letter_tasks(failed_at);

-- Trigger for dead_letter_tasks
CREATE TRIGGER update_dead_letter_updated_at
    BEFORE UPDATE ON dead_letter_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Task Locks Table (for distributed locking)
-- ============================================
CREATE TABLE IF NOT EXISTS task_locks (
    task_id TEXT PRIMARY KEY,
    locked_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for task_locks
CREATE INDEX IF NOT EXISTS idx_task_locks_expires_at ON task_locks(expires_at);
