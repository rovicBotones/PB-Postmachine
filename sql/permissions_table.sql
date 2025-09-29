-- Create permissions table to match existing naming convention
CREATE TABLE IF NOT EXISTS public.permissions (
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

-- Add RLS (Row Level Security) policies
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all permissions
CREATE POLICY "Admins can read permissions" ON public.permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow super admin to create/update/delete permissions
CREATE POLICY "Super admin can manage permissions" ON public.permissions
  FOR ALL USING (
    auth.uid()::text = '58eb73bd-f087-47f8-a6b3-11c08c6f7eb4'
  );

-- Insert default system permissions
INSERT INTO public.permissions (label, value, description, category, icon, is_system) VALUES
  ('View Users', 'users.view', 'Can view user accounts and their details', 'User Management', 'Eye', true),
  ('Add Users', 'users.add', 'Can create new user accounts', 'User Management', 'UserPlus', true),
  ('Edit Users', 'users.edit', 'Can modify existing user accounts', 'User Management', 'Edit3', true),
  ('Delete Users', 'users.delete', 'Can delete user accounts', 'User Management', 'UserX', true),
  ('Add Articles', 'articles.add', 'Can create new articles and posts', 'Content Management', 'Plus', true),
  ('Edit Articles', 'articles.edit', 'Can modify existing articles and posts', 'Content Management', 'Edit', true),
  ('Publish Articles', 'articles.publish', 'Can publish draft articles to live', 'Content Management', 'Send', true),
  ('Post to Facebook', 'post.post', 'Can publish posts to Facebook pages', 'Content Management', 'FileText', true),
  ('Manage Roles', 'roles.manage', 'Can create and modify user roles and permissions', 'Administration', 'Shield', true)
ON CONFLICT (value) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_value ON public.permissions(value);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();