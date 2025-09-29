-- Add article-specific permissions to existing permissions table
-- Run this in Supabase SQL Editor to add new permissions

INSERT INTO public.permissions (label, value, description, category, icon, is_system) VALUES
  ('Add Articles', 'articles.add', 'Can create new articles and posts', 'Content Management', 'Plus', true),
  ('Edit Articles', 'articles.edit', 'Can modify existing articles and posts', 'Content Management', 'Edit', true),
  ('Publish Articles', 'articles.publish', 'Can publish draft articles to live', 'Content Management', 'Send', true)
ON CONFLICT (value) DO NOTHING;

-- Optional: View all permissions to verify insertion
-- SELECT * FROM public.permissions ORDER BY category, label;