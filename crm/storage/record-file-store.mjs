import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dataDirectory = join(process.cwd(), "data", "crm-records");

function recordFileName(record) {
  const name = record.fields?.fullName || record.fields?.company || "record";
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${record.id}-${slug || "record"}.json`;
}

export async function saveIntakeRecord(record) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(
    join(dataDirectory, recordFileName(record)),
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );
}

export function getDataDirectory() {
  return dataDirectory;
}
