// One origin for the whole backend. Deriving the websocket URL from it keeps
// the two schemes in step, so an https page cannot end up opening a plain ws://
// socket that the browser will block.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8080";

export const API_BASE_URL = `${BACKEND_URL}/api`;
export const WS_BASE_URL = BACKEND_URL.replace(/^http/, "ws");
