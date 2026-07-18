import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const defaultFolder = join(
  homedir(),
  "Library",
  "Mobile Documents",
  "com~apple~CloudDocs",
  "CRM Intake",
);

const outputFolder =
  process.argv.find((argument) => argument.startsWith("--folder="))?.slice("--folder=".length) ||
  defaultFolder;

mkdirSync(outputFolder, { recursive: true });

const appleScript = `
on run argv
  set outputFolder to item 1 of argv
  set savedCount to 0
  set inspectedCount to 0

  tell application "Mail"
    set crmMessages to {}

    repeat with accountItem in accounts
      repeat with mailboxItem in mailboxes of accountItem
        try
          set matchedMessages to messages of mailboxItem whose subject contains "[TC-CRM:"
          set crmMessages to crmMessages & matchedMessages
        end try
      end repeat
    end repeat

    repeat with crmMessage in crmMessages
      set inspectedCount to inspectedCount + 1

      repeat with crmAttachment in mail attachments of crmMessage
        set attachmentName to name of crmAttachment

        if attachmentName ends with ".json" then
          set destinationFile to (outputFolder & "/" & attachmentName) as POSIX file
          save crmAttachment in destinationFile
          set savedCount to savedCount + 1
        end if
      end repeat
    end repeat
  end tell

  return "Saved " & savedCount & " JSON attachment(s) from " & inspectedCount & " CRM message(s) to " & outputFolder
end run
`;

const child = spawn("osascript", ["-e", appleScript, outputFolder], {
  stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";

child.stdout.on("data", (chunk) => {
  stdout += chunk;
});

child.stderr.on("data", (chunk) => {
  stderr += chunk;
});

child.on("close", (code) => {
  if (code !== 0) {
    if (stdout.trim()) console.log(stdout.trim());
    if (stderr.trim()) console.error(stderr.trim());
    process.exit(code || 1);
  }

  const decodedCount = normalizeSavedJsonFiles(outputFolder);
  const suffix = decodedCount ? ` Decoded ${decodedCount} base64 JSON file(s).` : "";

  if (stdout.trim()) {
    console.log(`${stdout.trim()}.${suffix}`.replace("..", "."));
  } else if (suffix) {
    console.log(suffix.trim());
  }
});

function normalizeSavedJsonFiles(folder) {
  let decodedCount = 0;

  for (const fileName of readdirSync(folder)) {
    if (!fileName.endsWith(".json")) continue;

    const filePath = join(folder, fileName);
    const content = readFileSync(filePath, "utf8").trim();

    if (!content) continue;

    try {
      JSON.parse(content);
      continue;
    } catch {
      // Older Worker emails arrived as base64 text attachments. Decode once.
    }

    try {
      const decoded = Buffer.from(content, "base64").toString("utf8").trim();
      JSON.parse(decoded);
      writeFileSync(filePath, `${decoded}\n`);
      decodedCount += 1;
    } catch {
      // Leave non-CRM or malformed files untouched.
    }
  }

  return decodedCount;
}
