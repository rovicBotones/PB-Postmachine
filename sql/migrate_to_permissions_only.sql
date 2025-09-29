-- Migration: Drop role_permissions table and use only permissions table
-- This creates a cleaner structure using role_permission_assignments

-- 1. Create role_permission_assignments table if it doesn't exist
-- This links roles to permissions using the permissions table
CREATE TABLE IF NOT EXISTS public.role_permission_assignments (
  id SERIAL PRIMARY KEY,
  role_id TEXT REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 2. Add RLS policies for role_permission_assignments
ALTER TABLE public.role_permission_assignments ENABLE ROW LEVEL SECURITY;

-- Allow admins to read role-permission assignments
CREATE POLICY "Admins can read role assignments" ON public.role_permission_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow super admin to manage role-permission assignments
CREATE POLICY "Super admin can manage role assignments" ON public.role_permission_assignments
  FOR ALL USING (
    auth.uid()::text = '58eb73bd-f087-47f8-a6b3-11c08c6f7eb4'
  );

-- 3. Migrate existing data from role_permissions to role_permission_assignments
-- (Only run this if you want to preserve existing data)
/*
INSERT INTO public.role_permission_assignments (role_id, permission_id)
SELECT DISTINCT
  rp.role_id,
  p.id
FROM public.role_permissions rp
JOIN public.permissions p ON p.value = rp.permission
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permission_assignments rpa
  WHERE rpa.role_id = rp.role_id AND rpa.permission_id = p.id
);
*/

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permission_assignments_role_id ON public.role_permission_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permission_assignments_permission_id ON public.role_permission_assignments(permission_id);

-- 5. Create view for easy querying of role permissions
CREATE OR REPLACE VIEW public.role_permissions_view AS
SELECT
  r.id as role_id,
  r.role as role_name,
  r.description as role_description,
  p.id as permission_id,
  p.label as permission_label,
  p.value as permission_value,
  p.description as permission_description,
  p.category as permission_category,
  p.icon as permission_icon,
  p.is_system,
  rpa.created_at as assigned_at
FROM public.roles r
LEFT JOIN public.role_permission_assignments rpa ON r.id = rpa.role_id
LEFT JOIN public.permissions p ON rpa.permission_id = p.id
ORDER BY r.role, p.category, p.label;

-- 6. Drop the old role_permissions table (CAREFUL - this deletes data!)
-- Uncomment only when you're ready to remove the old table
-- DROP TABLE IF EXISTS public.role_permissions;

-- 7. View the new structure
-- SELECT * FROM public.role_permissions_view;