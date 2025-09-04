/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_GEOAPIFY_KEY?: string;
  readonly VITE_FORCE_STATIC_MAPS?: 'true' | 'false';
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
