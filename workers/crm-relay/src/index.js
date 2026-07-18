const maxJsonBytes = 64 * 1024;

const coreFieldKeys = [
  "fullName",
  "location",
  "role",
  "company",
  "expertise",
  "howWeMet",
  "email",
  "phone",
  "website",
  "linkedin",
  "industry",
  "notes",
];

const requiredContactFields = [
  "firstName",
  "lastName",
  "company",
  "role",
  "email",
  "message",
];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = env.ALLOWED_ORIGIN || "https://tommasocorciulo.com";

  if (origin === allowedOrigin || origin === "http://127.0.0.1:4173") {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function jsonResponse(request, env, status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request, env),
    },
  });
}

async function readJson(request) {
  const contentType = request.headers.get("Content-Type") || "";

  if (!contentType.includes("application/json")) {
    throw Object.assign(new Error("Request body must be JSON."), { status: 415 });
  }

  const body = await request.text();

  if (body.length > maxJsonBytes) {
    throw Object.assign(new Error("Request body is too large."), { status: 413 });
  }

  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON."), { status: 400 });
  }
}

function validateContact(payload) {
  const cleaned = Object.fromEntries(
    Object.entries(payload || {}).map(([key, value]) => [key, clean(value)]),
  );
  const missingFields = requiredContactFields.filter((field) => !cleaned[field]);

  if (missingFields.length) {
    return {
      ok: false,
      status: 422,
      error: "Missing required fields.",
      details: { fields: missingFields },
    };
  }

  if (!isValidEmail(cleaned.email)) {
    return {
      ok: false,
      status: 422,
      error: "Please provide a valid email address.",
      details: { fields: ["email"] },
    };
  }

  return { ok: true, payload: cleaned };
}

function emptyFields() {
  return Object.fromEntries(coreFieldKeys.map((key) => [key, ""]));
}

function createCrmRecord(payload, request) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const fullName = [payload.firstName, payload.lastName].filter(Boolean).join(" ");

  return {
    id,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    source: {
      id: "main-page",
      name: "Website main page",
      channel: "website",
    },
    fields: {
      ...emptyFields(),
      fullName,
      role: payload.role,
      company: payload.company,
      howWeMet: "Website main page",
      email: payload.email,
      phone: payload.phone || "",
      notes: payload.message,
    },
    custom: {
      firstName: payload.firstName,
      lastName: payload.lastName,
    },
    review: {
      status: "unreviewed",
      lastReviewedAt: null,
      notes: "",
    },
    audit: [
      {
        at: now,
        action: "created",
        source: "main-page",
        metadata: {
          userAgent: request.headers.get("User-Agent"),
          ipCountry: request.cf?.country || null,
          ray: request.headers.get("CF-Ray"),
        },
      },
    ],
  };
}

function recordFileName(record) {
  const name = record.fields.fullName || record.fields.company || "record";
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${record.id}-${slug || "record"}.json`;
}

function emailText(record) {
  return [
    "New CRM contact received.",
    "",
    `Name: ${record.fields.fullName}`,
    `Company: ${record.fields.company}`,
    `Role: ${record.fields.role}`,
    `Email: ${record.fields.email}`,
    `Phone: ${record.fields.phone || "Not provided"}`,
    "",
    "Notes:",
    record.fields.notes,
    "",
    `Record ID: ${record.id}`,
    "The structured JSON record is attached.",
  ].join("\n");
}

async function sendRecordEmail(record, env) {
  const json = JSON.stringify(record, null, 2);
  const filename = recordFileName(record);
  const from = env.EMAIL_FROM || "crm@tommasocorciulo.com";
  const to = env.EMAIL_TO || "contact@tommasocorciulo.com";

  return env.EMAIL.send({
    to,
    from,
    replyTo: record.fields.email,
    subject: `[TC-CRM:main-page:v1] ${record.fields.fullName || record.id}`,
    text: emailText(record),
    attachments: [
      {
        content: new TextEncoder().encode(json),
        filename,
        type: "application/json",
        disposition: "attachment",
      },
    ],
  });
}

async function handleContact(request, env) {
  const payload = await readJson(request);
  const validation = validateContact(payload);

  if (!validation.ok) {
    return jsonResponse(request, env, validation.status, {
      error: validation.error,
      details: validation.details,
    });
  }

  const record = createCrmRecord(validation.payload, request);
  const result = await sendRecordEmail(record, env);

  return jsonResponse(request, env, 201, {
    id: record.id,
    status: record.review.status,
    emailId: result.messageId,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env),
      });
    }

    if (url.pathname !== "/api/contact") {
      return jsonResponse(request, env, 404, {
        error: "Not found.",
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(request, env, 405, {
        error: "Method not allowed.",
      });
    }

    try {
      return await handleContact(request, env);
    } catch (error) {
      const status = error.status || 500;
      const publicMessage = status >= 500 ? "Unable to send contact request." : error.message;

      console.error("CRM relay failed", {
        status,
        message: error.message,
        code: error.code,
      });

      return jsonResponse(request, env, status, {
        error: publicMessage,
      });
    }
  },
};
