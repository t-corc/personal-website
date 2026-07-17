export const crmSchemaVersion = 1;

export const coreFieldDefinitions = [
  { key: "fullName", label: "Name", type: "text" },
  { key: "location", label: "Location", type: "text" },
  { key: "role", label: "Role", type: "text" },
  { key: "company", label: "Company", type: "text" },
  { key: "expertise", label: "Expertise", type: "text" },
  { key: "howWeMet", label: "How we met", type: "text" },
  { key: "email", label: "Email address", type: "email" },
  { key: "phone", label: "Phone number", type: "tel" },
  { key: "website", label: "Website", type: "url" },
  { key: "linkedin", label: "LinkedIn", type: "url" },
  { key: "industry", label: "Industry", type: "text" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export function createEmptyCrmRecord({ id, source = "manual", now = new Date() } = {}) {
  const timestamp = now.toISOString();

  return {
    id,
    schemaVersion: crmSchemaVersion,
    createdAt: timestamp,
    updatedAt: timestamp,
    source: {
      id: source,
      channel: source === "manual" ? "manual" : "website",
    },
    fields: Object.fromEntries(coreFieldDefinitions.map((field) => [field.key, ""])),
    custom: {},
    review: {
      status: "unreviewed",
      lastReviewedAt: null,
      notes: "",
    },
    audit: [],
  };
}

export function normalizeCrmRecord(input, { now = new Date() } = {}) {
  const base = createEmptyCrmRecord({
    id: input?.id,
    source: input?.source?.id || input?.source || "manual",
    now,
  });

  const record = {
    ...base,
    ...input,
    schemaVersion: crmSchemaVersion,
    fields: {
      ...base.fields,
      ...(input?.fields || {}),
    },
    custom: input?.custom || {},
    review: {
      ...base.review,
      ...(input?.review || {}),
    },
    audit: Array.isArray(input?.audit) ? input.audit : [],
  };

  record.updatedAt = input?.updatedAt || record.updatedAt;
  return record;
}
