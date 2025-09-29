-- SQL Schema for Custom Permissions and Enhanced Role Management
-- Run this in Supabase SQL Editor

-- 1. Create permissions table to store custom permissions
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Custom',
  icon VARCHAR(50) DEFAULT 'Shield',
  is_system BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add RLS (Row Level Security) policies for permissions table
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all permissions
CREATE POLICY "Admins can read permissions" ON permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow super admin to create/update/delete permissions
CREATE POLICY "Super admin can manage permissions" ON permissions
  FOR ALL USING (
    auth.uid()::text = current_setting('app.protected_user_id', true)
  );

-- 3. Insert default system permissions
INSERT INTO permissions (label, value, description, category, icon, is_system) VALUES
  ('View Users', 'users.view', 'Can view user accounts and their details', 'User Management', 'Eye', true),
  ('Add Users', 'users.add', 'Can create new user accounts', 'User Management', 'UserPlus', true),
  ('Edit Users', 'users.edit', 'Can modify existing user accounts', 'User Management', 'Edit3', true),
  ('Delete Users', 'users.delete', 'Can delete user accounts', 'User Management', 'UserX', true),
  ('Post to Facebook', 'post.post', 'Can publish posts to Facebook pages', 'Content Management', 'FileText', true),
  ('Manage Roles', 'roles.manage', 'Can create and modify user roles and permissions', 'Administration', 'Shield', true)
ON CONFLICT (value) DO NOTHING;

-- 4. Create role_permission_assignments table to track which permissions are assigned to roles
CREATE TABLE IF NOT EXISTS role_permission_assignments (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 5. Add RLS policies for role_permission_assignments
ALTER TABLE role_permission_assignments ENABLE ROW LEVEL SECURITY;

-- Allow admins to read role-permission assignments
CREATE POLICY "Admins can read role assignments" ON role_permission_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow super admin to manage role-permission assignments
CREATE POLICY "Super admin can manage role assignments" ON role_permission_assignments
  FOR ALL USING (
    auth.uid()::text = current_setting('app.protected_user_id', true)
  );

-- 6. Create function to set protected user ID (run this with your actual protected user ID)
-- Replace 'your-protected-user-id-here' with the actual protected user ID
SELECT set_config('app.protected_user_id', '58eb73bd-f087-47f8-a6b3-11c08c6f7eb4', false);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_value ON permissions(value);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permission_role_id ON role_permission_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permission_permission_id ON role_permission_assignments(permission_id);

-- 8. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Create view for easy permission lookup with role assignments
CREATE OR REPLACE VIEW role_permissions_view AS
SELECT
  r.id as role_id,
  r.role as role_name,
  p.id as permission_id,
  p.label as permission_label,
  p.value as permission_value,
  p.description as permission_description,
  p.category as permission_category,
  p.icon as permission_icon,
  p.is_system,
  rpa.created_at as assigned_at
FROM roles r
LEFT JOIN role_permission_assignments rpa ON r.id = rpa.role_id
LEFT JOIN permissions p ON rpa.permission_id = p.id
ORDER BY r.role, p.category, p.label;