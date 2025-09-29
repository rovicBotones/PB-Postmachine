/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LONG_LIVED_ACCESS_TOKEN: string
  readonly VITE_ACCESS_TOKEN: string
  readonly VITE_API_URL: string
  readonly VITE_APP_ID: string
  readonly VITE_SECRET_KEY: string
  readonly VITE_SERVICE_ROLE: string
  readonly VITE_WP_ANON_KEY: string
  readonly VITE_WP_APP_PASSWORD: string
  readonly VITE_WP_APP_USERNAME: string
  readonly VITE_WP_SUPABASE_PROJ: string
  readonly VITE_WORDPRESS_BASE_URL: string
  readonly VITE_PRODUCTION_DOMAIN: string
  readonly VITE_PROTECTED_USER_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}