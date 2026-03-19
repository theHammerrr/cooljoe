declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

const runtimeApiUrl = window.__APP_CONFIG__?.apiUrl?.trim();
const viteApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = runtimeApiUrl || viteApiUrl || '';
