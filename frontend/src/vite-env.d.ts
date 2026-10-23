/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute API origin for production builds, e.g. https://api.example.com. Leave unset in development. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
