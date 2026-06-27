const PDF_OBJECT_KEY = "Ellie-CV-2026.pdf";
const PDF_DOWNLOAD_NAME = "Ellie-McCallum-CV.pdf";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBDOMAIN_HOME_PAGES = {
  "mercury.imle.uk": "/design.html",
  "cv.imle.uk": "/cv.html",
  "ux.imle.uk": "/ux.html",
  "chat.imle.uk": "/chat.html",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" && url.hostname in SUBDOMAIN_HOME_PAGES) {
      // Rewrite the pathname to your target static HTML file
      url.pathname = SUBDOMAIN_HOME_PAGES[url.hostname];
      
      // Fetch the asset directly using the modified URL
      return env.ASSETS.fetch(url);
    }

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
    return env.ASSETS.fetch(assetRequest);
  },
};

async function handleCvRequest(request, env) {
  const form = await request.formData();
  const email = normalizeEmail(form.get("email"));
  const token = form.get("cf-turnstile-response");
  const ipAddress = request.headers.get("CF-Connecting-IP") || "";

  if (!email) {
    return new Response("A valid email address is required", {
      status: 400,
      headers: noStoreHeaders(),
    });
  }

  const verification = await verifyTurnstileToken({
    token,
    secret: env.TURNSTILE_SECRET_KEY,
    remoteIp: ipAddress,
  });

  if (!verification.success) {
    console.log("Turnstile verification failed", {
      errorCodes: verification["error-codes"] || [],
      hostname: verification.hostname || null,
      action: verification.action || null,
    });

    return new Response("Verification failed", {
      status: 403,
      headers: noStoreHeaders(),
    });
  }

  await storeCvRequest({
    db: env.imle_cv_requests,
    email,
    ipAddress,
    hostname: verification.hostname,
  });

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

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : "";
}

async function storeCvRequest({ db, email, ipAddress, hostname }) {
  if (!db) {
    console.log("CV request D1 binding is missing; skipping request capture");
    return;
  }

  try {
    await db
      .prepare(
        `INSERT INTO cv_requests (email, ip_address, hostname, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(email, ipAddress, hostname || "")
      .run();
  } catch (error) {
    console.log("Failed to store CV request", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
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
