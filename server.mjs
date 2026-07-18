import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { extname, join, normalize } from "node:path";
import { createIntake, listSources } from "./crm/intake.mjs";
import { normalizeCrmRecord } from "./crm/schema.mjs";

const port = Number(process.env.PORT || 4173);
const root = new URL(".", import.meta.url).pathname;
const maxJsonBytes = 64 * 1024;
const localCrmFolder = join(
  homedir(),
  "Library",
  "Mobile Documents",
  "com~apple~CloudDocs",
  "CRM Intake",
);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(data));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > maxJsonBytes) {
        reject(Object.assign(new Error("Request body is too large."), { status: 413 }));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(Object.assign(new Error("Request body must be valid JSON."), { status: 400 }));
      }
    });

    request.on("error", reject);
  });
}

function getRequestContext(request) {
  return {
    userAgent: request.headers["user-agent"] || null,
    ip: request.socket.remoteAddress || null,
  };
}

function filenameFor(record) {
  const name = record.fields?.fullName || record.fields?.company || "record";
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${record.id}-${slug || "record"}.json`;
}

function readLocalCrmRecords() {
  mkdirSync(localCrmFolder, { recursive: true });

  return readdirSync(localCrmFolder)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      const filePath = join(localCrmFolder, fileName);
      const record = normalizeCrmRecord(JSON.parse(readFileSync(filePath, "utf8")));
      return { fileName, record };
    })
    .sort((a, b) => new Date(b.record.updatedAt) - new Date(a.record.updatedAt));
}

async function handleLocalCrmRequest(request, response, requestPath) {
  if (requestPath === "/api/local-crm/summary" && request.method === "GET") {
    try {
      sendJson(response, 200, {
        folder: localCrmFolder,
        count: readLocalCrmRecords().length,
      });
    } catch {
      sendJson(response, 500, { error: "Unable to load local CRM summary." });
    }

    return true;
  }

  if (requestPath === "/api/local-crm/records" && request.method === "GET") {
    try {
      sendJson(response, 200, {
        folder: localCrmFolder,
        records: readLocalCrmRecords().map(({ fileName, record }) => ({ fileName, record })),
      });
    } catch {
      sendJson(response, 500, { error: "Unable to load local CRM records." });
    }

    return true;
  }

  if (requestPath === "/api/local-crm/records" && request.method === "POST") {
    try {
      const payload = await readJsonBody(request);
      const record = normalizeCrmRecord(payload.record);

      if (!record.id) {
        sendJson(response, 422, { error: "Record id is required." });
        return true;
      }

      mkdirSync(localCrmFolder, { recursive: true });
      const fileName = filenameFor(record);
      writeFileSync(join(localCrmFolder, fileName), `${JSON.stringify(record, null, 2)}\n`);
      sendJson(response, 200, { fileName, record });
    } catch (error) {
      sendJson(response, error.status || 500, {
        error: error.status ? error.message : "Unable to save local CRM record.",
      });
    }

    return true;
  }

  if (requestPath.startsWith("/api/local-crm/")) {
    sendJson(response, 404, { error: "Not found." });
    return true;
  }

  return false;
}

async function handleApiRequest(request, response, requestPath) {
  if (requestPath.startsWith("/api/local-crm/")) {
    return handleLocalCrmRequest(request, response, requestPath);
  }

  if (request.method === "GET" && requestPath === "/api/sources") {
    sendJson(response, 200, { sources: listSources() });
    return true;
  }

  const sourceId =
    requestPath === "/api/contact"
      ? "main-page"
      : requestPath.startsWith("/api/intake/")
        ? requestPath.slice("/api/intake/".length)
        : null;

  if (!sourceId) return false;

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return true;
  }

  try {
    const payload = await readJsonBody(request);
    const result = await createIntake(sourceId, payload, getRequestContext(request));

    if (!result.ok) {
      sendJson(response, result.status || 400, {
        error: result.error,
        details: result.details || null,
      });
      return true;
    }

    sendJson(response, result.status, {
      id: result.record.id,
      status: result.record.review.status,
    });
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: error.status ? error.message : "Unable to save contact request.",
    });
  }

  return true;
}

createServer(async (request, response) => {
  const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);

  if (requestPath.startsWith("/api/")) {
    const handled = await handleApiRequest(request, response, requestPath);

    if (handled) return;
  }

  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  let filePath = normalize(join(root, relativePath));

  if (filePath.startsWith(root) && existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = normalize(join(filePath, "index.html"));
  }

  if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Portfolio running at http://127.0.0.1:${port}`);
});
