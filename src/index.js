const PDF_OBJECT_KEY = "Ellie-CV-2026.pdf";
const PDF_DOWNLOAD_NAME = "Ellie-McCallum-CV.pdf";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/request-cv") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", {
          status: 405,
          headers: {
            Allow: "POST",
          },
        });
      }

      return handleCvRequest(request, env);
    }

    // Everything else is served from the built static assets.
    return env.ASSETS.fetch(request);
  },
};

async function handleCvRequest(request, env) {
  const form = await request.formData();
  const token = form.get("cf-turnstile-response");

  const verification = await verifyTurnstileToken({
    token,
    secret: env.TURNSTILE_SECRET_KEY,
    remoteIp: request.headers.get("CF-Connecting-IP"),
  });

  if (!verification.success) {
    return new Response("Verification failed", {
      status: 403,
      headers: noStoreHeaders(),
    });
  }

  const object = await env.PRIVATE_CV_BUCKET.get(PDF_OBJECT_KEY);

  if (!object) {
    return new Response("CV not found", {
      status: 404,
      headers: noStoreHeaders(),
    });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${PDF_DOWNLOAD_NAME}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      ETag: object.httpEtag,
    },
  });
}

async function verifyTurnstileToken({ token, secret, remoteIp }) {
  if (!token || !secret) {
    return { success: false };
  }

  const body = new URLSearchParams({
    secret,
    response: String(token),
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  return fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  }).then((response) => response.json());
}

function noStoreHeaders() {
  return {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  };
}
