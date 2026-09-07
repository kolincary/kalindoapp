/**
 * Master PostgreSQL Schema DDL Generator for Kalindo Scan
 * 
 * Copy and execute this SQL script in the Supabase SQL Editor of any new project.
 * It creates all tables, primary keys, indexes, triggers, and public RLS permissions.
 */

export const MASTER_SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- MASTER SUPABASE SQL SCHEMA FOR KALINDO SCAN APPLICATION
-- ==============================================================================
-- Buka Supabase Dashboard > SQL Editor > New Query > Paste & Run
-- ==============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE: scanned_items (Data Scan Barcode Lapangan)
CREATE TABLE IF NOT EXISTS public.scanned_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    barcode TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'PICKER',
    timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
    destination TEXT DEFAULT '',
    priority TEXT DEFAULT 'NORMAL',
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'COMPLETED',
    employee_name TEXT DEFAULT '',
    menu_context TEXT DEFAULT '',
    scan_mode TEXT DEFAULT 'INDIVIDU',
    team_members TEXT[] DEFAULT '{}',
    excel_filename TEXT DEFAULT '',
    report_keterangan TEXT DEFAULT '',
    report_msku TEXT DEFAULT '',
    report_qty TEXT DEFAULT '',
    order_id TEXT DEFAULT '',
    brand_type TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for maximum query speed
CREATE INDEX IF NOT EXISTS idx_scanned_items_timestamp ON public.scanned_items (timestamp);
CREATE INDEX IF NOT EXISTS idx_scanned_items_barcode ON public.scanned_items (barcode);
CREATE INDEX IF NOT EXISTS idx_scanned_items_role ON public.scanned_items (role);
CREATE INDEX IF NOT EXISTS idx_scanned_items_destination ON public.scanned_items (destination);
CREATE INDEX IF NOT EXISTS idx_scanned_items_order_id ON public.scanned_items (order_id);
CREATE INDEX IF NOT EXISTS idx_scanned_items_barcode_order ON public.scanned_items (barcode, order_id);
CREATE INDEX IF NOT EXISTS idx_scanned_items_role_ts ON public.scanned_items (role, timestamp);
CREATE INDEX IF NOT EXISTS idx_scanned_items_menu_context ON public.scanned_items (menu_context);

-- 3. TABLE: admin_imports (Data Manifest Import Admin)
CREATE TABLE IF NOT EXISTS public.admin_imports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    filename TEXT NOT NULL,
    jumlah INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    barcodes TEXT[] DEFAULT '{}',
    admin_name TEXT DEFAULT '',
    order_id TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_admin_imports_created_at ON public.admin_imports (created_at);
CREATE INDEX IF NOT EXISTS idx_admin_imports_filename ON public.admin_imports (filename);

-- 4. TABLE: cancelled_orders (Data Resi Cancel Gudang & Import)
CREATE TABLE IF NOT EXISTS public.cancelled_orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    barcode TEXT NOT NULL,
    reason TEXT DEFAULT '',
    source TEXT DEFAULT 'GUDANG',
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint,
    is_active BOOLEAN DEFAULT true,
    cancelled_by TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_cancelled_orders_barcode ON public.cancelled_orders (barcode);
CREATE INDEX IF NOT EXISTS idx_cancelled_orders_active ON public.cancelled_orders (is_active);

-- 5. TABLE: batch_items (Rekap Batch Print)
CREATE TABLE IF NOT EXISTS public.batch_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    excel_filename TEXT DEFAULT '',
    batch_date TEXT DEFAULT '',
    batch_time TEXT DEFAULT '',
    admin_name TEXT DEFAULT '',
    total_items INTEGER DEFAULT 0,
    barcodes TEXT[] DEFAULT '{}',
    order_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batch_items_batch_date ON public.batch_items (batch_date);
CREATE INDEX IF NOT EXISTS idx_batch_items_order_id ON public.batch_items (order_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_barcode_order ON public.batch_items (excel_filename, order_id);

-- 6. TABLE: admin_shift_notes (Catatan Shift & Pengumuman Admin)
CREATE TABLE IF NOT EXISTS public.admin_shift_notes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'SHIFT_HANDOVER',
    created_by TEXT DEFAULT 'Admin',
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint,
    is_active BOOLEAN DEFAULT true,
    target_role TEXT DEFAULT 'ALL',
    read_by JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_admin_shift_notes_active ON public.admin_shift_notes (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_shift_notes_ts ON public.admin_shift_notes (created_at);

-- 7. TABLE: employees (Data Karyawan, Target & PIN)
CREATE TABLE IF NOT EXISTS public.employees (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    allowed_roles TEXT[] DEFAULT '{}',
    shift TEXT DEFAULT '1',
    daily_target INTEGER DEFAULT 0,
    pin TEXT DEFAULT ''
);

-- 8. TABLE: user_permissions & user_pins
CREATE TABLE IF NOT EXISTS public.user_permissions (
    role TEXT PRIMARY KEY,
    permissions TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.user_pins (
    role TEXT PRIMARY KEY,
    pin TEXT NOT NULL
);

-- 9. TABLE: app_settings (Global Settings & Remote Refresh Trigger)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_force_refresh_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Insert Default Row for app_settings if not exists
INSERT INTO public.app_settings (id, last_force_refresh_at, settings)
VALUES (1, (extract(epoch from now()) * 1000)::bigint, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 10. TABLE: app_profiles_config (Konfigurasi Profil)
CREATE TABLE IF NOT EXISTS public.app_profiles_config (
    id BIGSERIAL PRIMARY KEY,
    role TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    use_page_modal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABLE: running_texts (Running Text Banner)
CREATE TABLE IF NOT EXISTS public.running_texts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint,
    created_by TEXT DEFAULT 'Admin'
);

-- 12. TABLE: admin_special_scans (Special Scan Data)
CREATE TABLE IF NOT EXISTS public.admin_special_scans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    barcode TEXT NOT NULL,
    destination TEXT DEFAULT '',
    note TEXT DEFAULT '',
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint,
    created_by TEXT DEFAULT 'Admin'
);

-- 13. TABLE: failed_scans (Riwayat Gagal Scan)
CREATE TABLE IF NOT EXISTS public.failed_scans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    barcode TEXT NOT NULL,
    role TEXT NOT NULL,
    reason TEXT DEFAULT '',
    timestamp BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint,
    employee_name TEXT DEFAULT ''
);

-- 14. TABLE: daily_quests (Misi Harian)
CREATE TABLE IF NOT EXISTS public.daily_quests (
    id BIGSERIAL PRIMARY KEY,
    role TEXT NOT NULL,
    target_count INTEGER DEFAULT 0,
    reward_text TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. TABLE: admin_users (Admin Accounts)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT DEFAULT '',
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ
);

-- 16. TABLE: app_roles & app_shifts
CREATE TABLE IF NOT EXISTS public.app_roles (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.app_shifts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TEXT DEFAULT '',
    end_time TEXT DEFAULT ''
);

-- 17. Disable RLS for all tables (Allow smooth operation via anon key)
ALTER TABLE public.scanned_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_imports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancelled_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_shift_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_profiles_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_texts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_special_scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_shifts DISABLE ROW LEVEL SECURITY;

-- 18. Grant Full Privileges to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- SELESAI! SEMUA TABEL, INDEKS & AKSES SIAP DIGUNAKAN 100%.
-- ==============================================================================
`;
