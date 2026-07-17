import { randomUUID } from "node:crypto";
import { createEmptyCrmRecord, normalizeCrmRecord } from "./schema.mjs";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function createCrmRecordFromMainPage(payload, context = {}) {
  const now = new Date();
  const record = createEmptyCrmRecord({
    id: randomUUID(),
    source: "main-page",
    now,
  });

  const firstName = clean(payload.firstName);
  const lastName = clean(payload.lastName);

  record.source = {
    id: "main-page",
    name: "Website main page",
    channel: "website",
  };

  record.fields = {
    ...record.fields,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    role: clean(payload.role),
    company: clean(payload.company),
    email: clean(payload.email),
    phone: clean(payload.phone),
    notes: clean(payload.message),
  };

  record.custom = {
    firstName,
    lastName,
  };

  record.audit = [
    {
      at: now.toISOString(),
      action: "created",
      source: "main-page",
      metadata: {
        userAgent: context.userAgent || null,
        ip: context.ip || null,
      },
    },
  ];

  return normalizeCrmRecord(record, { now });
}
