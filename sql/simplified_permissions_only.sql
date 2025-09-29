-- Simplified Permission System: Use only permissions table
-- This adds role assignments directly to the permissions table

-- 1. Add role columns to permissions table
ALTER TABLE public.permissions
ADD COLUMN IF NOT EXISTS assigned_roles TEXT[] DEFAULT '{}';

-- 2. Migrate existing role_permissions data to permissions table
-- Update permissions with their assigned roles
UPDATE public.permissions
SET assigned_roles = ARRAY(
  SELECT DISTINCT rp.role
  FROM public.role_permissions rp
  WHERE rp.permission = public.permissions.value
);

-- 3. Add some default role assignments for system permissions
UPDATE public.permissions
SET assigned_roles = ARRAY['admin', 'moderator']
WHERE value IN ('users.view', 'users.add', 'users.edit', 'post.post');

UPDATE public.permissions
SET assigned_roles = ARRAY['admin']
WHERE value IN ('users.delete', 'roles.manage');

-- 4. Add article permissions with role assignments
INSERT INTO public.permissions (label, value, description, category, icon, is_system, assigned_roles) VALUES
  ('Add Articles', 'articles.add', 'Can create new articles and posts', 'Content Management', 'Plus', true, ARRAY['admin', 'moderator']),
  ('Edit Articles', 'articles.edit', 'Can modify existing articles and posts', 'Content Management', 'Edit', true, ARRAY['admin', 'moderator']),
  ('Publish Articles', 'articles.publish', 'Can publish draft articles to live', 'Content Management', 'Send', true, ARRAY['admin', 'moderator'])
ON CONFLICT (value) DO UPDATE SET
  assigned_roles = EXCLUDED.assigned_roles;

-- 5. Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id_param UUID, permission_value_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.permissions p
    JOIN public.user_roles ur ON ur.role = ANY(p.assigned_roles)
    WHERE p.value = permission_value_param
    AND ur.user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create view for user permissions
CREATE OR REPLACE VIEW public.user_permissions_view AS
SELECT DISTINCT
  ur.user_id,
  ur.role as user_role,
  p.id as permission_id,
  p.label as permission_label,
  p.value as permission_value,
  p.description as permission_description,
  p.category as permission_category,
  p.icon as permission_icon,
  p.is_system,
  p.assigned_roles
FROM public.permissions p
CROSS JOIN UNNEST(p.assigned_roles) AS role_name
JOIN public.user_roles ur ON ur.role = role_name;

-- 7. Drop the old role_permissions table
DROP TABLE IF EXISTS public.role_permissions;

-- 8. Drop role_permission_assignments if it exists
DROP TABLE IF EXISTS public.role_permission_assignments;

-- 9. View the new structure
-- SELECT * FROM public.user_permissions_view WHERE user_id = 'your-user-id-here';