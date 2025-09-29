-- Test query to check if super admin role exists
-- Run this in Supabase SQL Editor to verify data

-- Check if the user exists in user_roles table
SELECT * FROM public.user_roles
WHERE user_id = '58eb73bd-f087-47f8-a6b3-11c08c6f7eb4';

-- Check all user_roles for debugging
SELECT * FROM public.user_roles;

-- Check if the user exists in auth.users
SELECT id, email FROM auth.users
WHERE id = '58eb73bd-f087-47f8-a6b3-11c08c6f7eb4';

-- Test the exact query that getUserRole is running
SELECT role FROM public.user_roles
WHERE user_id = '58eb73bd-f087-47f8-a6b3-11c08c6f7eb4';