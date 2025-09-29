-- Rollback script to remove permissions migration
-- Run this in your Supabase SQL Editor to clean up permission-related changes

-- =====================================================
-- 1. Drop permissions table if it exists
-- =====================================================

DROP TABLE IF EXISTS public.permissions CASCADE;

-- =====================================================
-- 2. Remove added columns from roles table (if they were added by migration)
-- =====================================================

-- Note: Be careful with this - only run if you added these columns with the migration
-- and you want to completely revert to the original structure

-- Uncomment the lines below ONLY if you want to remove columns added by migration:

-- DO $$
-- BEGIN
--     -- Remove created_at column if it exists
--     IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'created_at') THEN
--         ALTER TABLE public.roles DROP COLUMN created_at;
--     END IF;

--     -- Remove updated_at column if it exists
--     IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'updated_at') THEN
--         ALTER TABLE public.roles DROP COLUMN updated_at;
--     END IF;

--     -- Remove name column if it exists
--     IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'name') THEN
--         ALTER TABLE public.roles DROP COLUMN name;
--     END IF;

--     -- Remove description column if it exists
--     IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'description') THEN
--         ALTER TABLE public.roles DROP COLUMN description;
--     END IF;

--     -- Remove permissions column if it exists
--     IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'permissions') THEN
--         ALTER TABLE public.roles DROP COLUMN permissions;
--     END IF;

--     -- Remove is_system column if it exists
--     IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'is_system') THEN
--         ALTER TABLE public.roles DROP COLUMN is_system;
--     END IF;
-- END$$;

-- =====================================================
-- 3. Drop any functions created for permission management
-- =====================================================

DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- =====================================================
-- 4. Drop any indexes created for permissions
-- =====================================================

DROP INDEX IF EXISTS public.idx_permissions_category;
DROP INDEX IF EXISTS public.idx_permissions_resource;
DROP INDEX IF EXISTS public.idx_permissions_action;
DROP INDEX IF EXISTS public.idx_roles_is_system;
DROP INDEX IF EXISTS public.idx_roles_created_at;

-- =====================================================
-- 5. Clean up any RLS policies for permissions
-- =====================================================

-- Note: This will also remove policies from roles table if they were created by migration
-- Only run this if you want to remove all RLS policies

-- DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
-- DROP POLICY IF EXISTS "Only admins can modify permissions" ON public.permissions;
-- DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
-- DROP POLICY IF EXISTS "Only admins can modify roles" ON public.roles;

-- =====================================================
-- 6. Disable RLS on tables if it was enabled by migration
-- =====================================================

-- Uncomment if you want to disable RLS (be careful!)
-- ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. Remove any standard roles that were inserted by migration
-- =====================================================

-- Uncomment and modify as needed - be very careful with this!
-- Only run if you want to remove roles that were created by the migration

-- DELETE FROM public.roles WHERE id IN ('admin', 'editor', 'moderator', 'viewer') AND is_system = true;

-- =====================================================
-- Rollback complete message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Rollback completed!';
    RAISE NOTICE 'Dropped permissions table';
    RAISE NOTICE 'Removed permission-related functions and indexes';
    RAISE NOTICE 'Note: Role table columns and data were preserved for safety';
    RAISE NOTICE 'Uncomment additional sections in script if you need to remove more components';
END$$;