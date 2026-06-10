// Leitura, escrita e merge do CSV de posts.
import { promises as fs } from "node:fs";
import path from "node:path";

export const CSV_COLUMNS = [
  "shortcode",
  "url",
  "type",
  "taken_at",
  "timestamp",
  "likes",
  "comments",
  "views",
  "engagement_rate",
  "caption",
  "thumbnail",
];

function escapeField(value) {
  if (value === null || value === undefined) return "";
  let s = String(value);
  s = s.replace(/\r\n|\r|\n/g, " ");
  if (/[",]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function toCsv(posts) {
  const lines = [CSV_COLUMNS.join(",")];
  for (const p of posts) {
    lines.push(CSV_COLUMNS.map((c) => escapeField(p[c])).join(","));
  }
  return lines.join("\n") + "\n";
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field); field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (!(row.length === 1 && row[0] === "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
  }
  return rows;
}

export async function readExisting(csvPath) {
  let text;
  try {
    text = await fs.readFile(csvPath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rec = {};
    header.forEach((col, idx) => { rec[col] = row[idx] ?? ""; });
    rec.timestamp = rec.timestamp ? Number(rec.timestamp) : 0;
    out.push(rec);
  }
  return out;
}

export function mergePosts(existing, fresh) {
  const byShortcode = new Map();
  for (const p of existing) {
    if (p.shortcode) byShortcode.set(p.shortcode, p);
  }
  let added = 0;
  let updated = 0;
  for (const p of fresh) {
    if (!p.shortcode) continue;
    if (byShortcode.has(p.shortcode)) updated++;
    else added++;
    byShortcode.set(p.shortcode, { ...byShortcode.get(p.shortcode), ...p });
  }
  const merged = Array.from(byShortcode.values());
  merged.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
  return { merged, added, updated };
}

export async function writeCsv(csvPath, posts) {
  await fs.mkdir(path.dirname(csvPath), { recursive: true });
  await fs.writeFile(csvPath, toCsv(posts), "utf8");
}
