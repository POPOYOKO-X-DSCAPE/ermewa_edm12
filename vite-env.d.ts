/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_HOST: string;
  readonly VITE_API_PATH_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
