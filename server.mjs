import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { createIntake, listSources } from "./crm/intake.mjs";

const port = Number(process.env.PORT || 4173);
const root = new URL(".", import.meta.url).pathname;
const maxJsonBytes = 64 * 1024;

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

async function handleApiRequest(request, response, requestPath) {
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
