import { saveIntakeRecord } from "./storage/record-file-store.mjs";
import { normalizeMainPageContact } from "./sources/main-page.mjs";

const sourceAdapters = {
  "main-page": normalizeMainPageContact,
};

export function listSources() {
  return Object.keys(sourceAdapters);
}

export async function createIntake(sourceId, payload, context = {}) {
  const normalize = sourceAdapters[sourceId];

  if (!normalize) {
    return {
      ok: false,
      status: 404,
      error: `Unknown CRM intake source: ${sourceId}`,
    };
  }

  const result = normalize(payload, context);

  if (!result.ok) return result;

  const record = result.record;

  await saveIntakeRecord(record);

  return {
    ok: true,
    status: 201,
    record,
  };
}
