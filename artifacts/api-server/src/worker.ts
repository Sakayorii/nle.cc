type JsonResponseOptions = ResponseInit & {
  headers?: HeadersInit;
};

function jsonResponse(data: unknown, options: JsonResponseOptions = {}): Response {
  const headers = new Headers(options.headers ?? {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set("access-control-allow-headers", "Content-Type, Authorization");

  return new Response(JSON.stringify(data), {
    ...options,
    headers,
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          "access-control-allow-headers": "Content-Type, Authorization",
        },
      });
    }

    if (url.pathname === "/api/healthz") {
      return jsonResponse({ status: "ok" });
    }

    if (url.pathname === "/") {
      return jsonResponse({
        ok: true,
        service: "nle.cc api",
        platform: "cloudflare-worker",
      });
    }

    return jsonResponse({ error: "Not found" }, { status: 404 });
  },
};
