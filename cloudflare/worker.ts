type Env = {
  API_BASE_URL?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
};

async function proxyApi(request: Request, apiBase: string): Promise<Response> {
  const url = new URL(request.url);
  const target = new URL(`${url.pathname}${url.search}`, apiBase);

  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.clone().text();
  }

  const response = await fetch(target, init);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      if (!env.API_BASE_URL) {
        return Response.json(
          { error: 'API_BASE_URL is not configured' },
          { status: 500 },
        );
      }

      return proxyApi(request, env.API_BASE_URL);
    }

    return env.ASSETS.fetch(request);
  },
};
