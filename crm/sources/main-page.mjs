import { createCrmRecordFromMainPage } from "../record-factory.mjs";

const requiredFields = [
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

function assertEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeMainPageContact(payload, context = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(payload || {}).map(([key, value]) => [key, clean(value)]),
  );

  const missingFields = requiredFields.filter((field) => !cleaned[field]);

  if (missingFields.length) {
    return {
      ok: false,
      status: 422,
      error: "Missing required fields.",
      details: { fields: missingFields },
    };
  }

  if (!assertEmail(cleaned.email)) {
    return {
      ok: false,
      status: 422,
      error: "Please provide a valid email address.",
      details: { fields: ["email"] },
    };
  }

  return {
    ok: true,
    record: createCrmRecordFromMainPage(cleaned, context),
  };
}
