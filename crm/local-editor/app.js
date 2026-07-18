import { coreFieldDefinitions, createEmptyCrmRecord, normalizeCrmRecord } from "../schema.mjs";

const folderButton = document.querySelector("#open-folder");
const newButton = document.querySelector("#new-record");
const saveButton = document.querySelector("#save-record");
const addFieldButton = document.querySelector("#add-field");
const folderStatus = document.querySelector("#folder-status");
const tableHead = document.querySelector("#table-head");
const tableBody = document.querySelector("#table-body");
const emptyState = document.querySelector("#empty-state");
const editor = document.querySelector("#editor");
const editorTitle = document.querySelector("#editor-title");
const recordId = document.querySelector("#record-id");
const recordForm = document.querySelector("#record-form");
const customForm = document.querySelector("#custom-form");
const searchInput = document.querySelector("#search");

let directoryHandle = null;
let records = [];
let selectedId = null;
let dirty = false;
let localServerFolder = null;
const canUseLocalServer =
  window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";

const tableFields = [
  "fullName",
  "company",
  "role",
  "location",
  "industry",
  "email",
  "linkedin",
  "updatedAt",
];

function setDirty(value) {
  dirty = value;
  saveButton.disabled = !selectedId || !dirty;
}

function getSelectedRecord() {
  return records.find((record) => record.id === selectedId) || null;
}

function filenameFor(record) {
  const name = record.fields.fullName || record.fields.company || "record";
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${record.id}-${slug || "record"}.json`;
}

function formatValue(value) {
  if (!value) return "";
  return String(value);
}

function allVisibleRecords() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return records;

  return records.filter((record) => {
    const haystack = JSON.stringify({
      fields: record.fields,
      custom: record.custom,
    }).toLowerCase();
    return haystack.includes(query);
  });
}

function renderTable() {
  tableHead.innerHTML = `
    <tr>
      ${tableFields.map((field) => `<th>${field === "updatedAt" ? "Updated" : labelFor(field)}</th>`).join("")}
    </tr>
  `;

  const visibleRecords = allVisibleRecords();

  if (!visibleRecords.length) {
    tableBody.replaceChildren(emptyState.content.cloneNode(true));
    return;
  }

  tableBody.innerHTML = visibleRecords
    .map((record) => {
      const isSelected = record.id === selectedId ? "is-selected" : "";
      return `
        <tr class="${isSelected}" data-id="${record.id}">
          ${tableFields
            .map((field) => {
              const value =
                field === "updatedAt"
                  ? new Date(record.updatedAt).toLocaleDateString()
                  : record.fields[field];
              return `<td>${escapeHtml(formatValue(value))}</td>`;
            })
            .join("")}
        </tr>
      `;
    })
    .join("");
}

function labelFor(key) {
  return coreFieldDefinitions.find((field) => field.key === key)?.label || key;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderEditor() {
  const record = getSelectedRecord();
  editor.hidden = !record;
  saveButton.disabled = !record || !dirty;
  addFieldButton.disabled = !record;

  if (!record) return;

  editorTitle.textContent = record.fields.fullName || record.fields.company || "Untitled";
  recordId.textContent = record.id;

  recordForm.innerHTML = coreFieldDefinitions
    .map((field) => {
      const value = escapeHtml(record.fields[field.key] || "");
      const control =
        field.type === "textarea"
          ? `<textarea name="${field.key}" rows="5">${value}</textarea>`
          : `<input name="${field.key}" type="${field.type}" value="${value}" />`;

      return `
        <label>
          <span>${field.label}</span>
          ${control}
        </label>
      `;
    })
    .join("");

  customForm.innerHTML = Object.entries(record.custom)
    .map(
      ([key, value]) => `
        <label>
          <span>${escapeHtml(key)}</span>
          <input name="${escapeHtml(key)}" value="${escapeHtml(value)}" data-custom-field />
        </label>
      `,
    )
    .join("");
}

async function readRecordsFromFolder(handle) {
  const loaded = [];

  for await (const entry of handle.values()) {
    if (entry.kind !== "file" || !entry.name.endsWith(".json")) continue;

    const file = await entry.getFile();
    const text = await file.text();
    loaded.push(normalizeCrmRecord(JSON.parse(text)));
  }

  loaded.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return loaded;
}

async function loadLocalServerRecords() {
  const response = await fetch("/api/local-crm/records");
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "Unable to load local CRM folder.");
  }

  directoryHandle = null;
  localServerFolder = result.folder;
  records = (result.records || []).map(({ record }) => normalizeCrmRecord(record));
  selectedId = records[0]?.id || null;
  folderStatus.textContent = `Auto-loaded ${records.length} record${records.length === 1 ? "" : "s"}`;
  folderButton.textContent = "Choose different folder";
  setDirty(false);
  renderTable();
  renderEditor();
}

async function chooseFolder() {
  if (!window.showDirectoryPicker) {
    folderStatus.textContent = "Use Chrome or Edge for folder access";
    return;
  }

  directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
  localServerFolder = null;
  records = await readRecordsFromFolder(directoryHandle);
  folderStatus.textContent = directoryHandle.name;
  selectedId = records[0]?.id || null;
  setDirty(false);
  renderTable();
  renderEditor();
}

function createRecord() {
  const record = createEmptyCrmRecord({
    id: crypto.randomUUID(),
    source: "manual",
  });

  records.unshift(record);
  selectedId = record.id;
  setDirty(true);
  renderTable();
  renderEditor();
}

function updateSelectedFromForms() {
  const record = getSelectedRecord();
  if (!record) return;

  const formData = new FormData(recordForm);
  coreFieldDefinitions.forEach((field) => {
    record.fields[field.key] = String(formData.get(field.key) || "");
  });

  const customData = new FormData(customForm);
  record.custom = Object.fromEntries(
    Object.keys(record.custom).map((key) => [key, String(customData.get(key) || "")]),
  );

  record.updatedAt = new Date().toISOString();
}

async function saveRecord() {
  const record = getSelectedRecord();
  if (!record) return;

  updateSelectedFromForms();

  if (localServerFolder) {
    const response = await fetch("/api/local-crm/records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ record }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      folderStatus.textContent = result.error || "Unable to save record";
      return;
    }

    folderStatus.textContent = `Saved ${result.fileName}`;
  } else if (directoryHandle) {
    const handle = await directoryHandle.getFileHandle(filenameFor(record), {
      create: true,
    });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(record, null, 2));
    await writable.close();
    folderStatus.textContent = `Saved ${filenameFor(record)}`;
  } else {
    folderStatus.textContent = "Choose a folder before saving";
    return;
  }

  setDirty(false);
  renderTable();
  renderEditor();
}

function addCustomField() {
  const record = getSelectedRecord();
  if (!record) return;

  const key = window.prompt("Field name");
  if (!key) return;

  const normalizedKey = key
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, character) => character.toUpperCase())
    .replace(/^[A-Z]/, (character) => character.toLowerCase());

  if (!normalizedKey) return;
  record.custom[normalizedKey] = "";
  setDirty(true);
  renderEditor();
}

folderButton.addEventListener("click", chooseFolder);
newButton.addEventListener("click", createRecord);
saveButton.addEventListener("click", saveRecord);
addFieldButton.addEventListener("click", addCustomField);
searchInput.addEventListener("input", renderTable);

tableBody.addEventListener("click", (event) => {
  const row = event.target.closest("[data-id]");
  if (!row) return;
  selectedId = row.dataset.id;
  setDirty(false);
  renderTable();
  renderEditor();
});

recordForm.addEventListener("input", () => {
  updateSelectedFromForms();
  setDirty(true);
  renderTable();
});

customForm.addEventListener("input", () => {
  updateSelectedFromForms();
  setDirty(true);
});

if (canUseLocalServer) {
  loadLocalServerRecords().catch((error) => {
    folderStatus.textContent = error.message || "No folder selected";
    renderTable();
  });
} else {
  folderStatus.textContent = "Public editor shell";
  renderTable();
}
