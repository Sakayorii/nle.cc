import api from "../artifacts/api-server/src/app";

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  LOG_LEVEL?: string;
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString: string };
}

async function serveFrontend(request: Request, env: Env): Promise<Response> {
  const response = await env.ASSETS.fetch(request);

  if (response.status === 404 && request.method === "GET") {
    const indexRequest = new Request(new URL("/index.html", request.url), request);
    return env.ASSETS.fetch(indexRequest);
  }

  return response;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return api.fetch(request, env);
    }

    return serveFrontend(request, env);
  },
};
