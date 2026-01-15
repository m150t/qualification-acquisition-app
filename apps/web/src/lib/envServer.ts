import fs from "fs";
import path from "path";

let envLoaded = false;

function readEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf8");
  const entries: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && !(key in process.env)) entries[key] = value;
  }
  return entries;
}

export function ensureServerEnv(): void {
  if (envLoaded) return;
  envLoaded = true;
  if (typeof process === "undefined" || !process.env) return;
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, ".env"),
    path.resolve(cwd, ".env.production"),
    path.resolve(cwd, "apps/web/.env"),
    path.resolve(cwd, "apps/web/.env.production"),
  ];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const entries = readEnvFile(filePath);
    for (const [key, value] of Object.entries(entries)) {
      process.env[key] = value;
    }
  }
}
