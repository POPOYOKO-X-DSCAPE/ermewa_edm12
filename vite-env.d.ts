/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
	readonly VITE_API_ENABLE_SEEDS: boolean;
	readonly VITE_ENABLE_OFFLINE_SERVICES: boolean;
	readonly VITE_LOCALHOST: string;
	readonly VITE_API_HOST: string;
	readonly VITE_OFFLINE_API_PORT: string;
	readonly VITE_API_PATH_NAME: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
