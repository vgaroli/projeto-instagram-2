#!/usr/bin/env node
// MCP server: exporta análise de Instagram de escola para o Firestore (maestro4edu).
// Lê lista.csv, perfil.json e arquivos .md de análise de uma pasta e grava na
// subcoleção `escolas/{schoolId}/socialMediaAnalyses`.
//
// Requer workspace-key.json na raiz do projeto (service account Firebase).
import path from "node:path";
import { promises as fs, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import admin from "firebase-admin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// workspace-key.json fica na raiz do projeto (3 níveis acima deste arquivo)
const KEY_PATH =
  process.env.FIREBASE_KEY_PATH ||
  path.resolve(__dirname, "..", "..", "..", "workspace-key.json");

// Inicializa o Firebase Admin SDK na inicialização do processo
function initDb() {
  const serviceAccount = JSON.parse(readFileSync(KEY_PATH, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return admin.firestore();
}

const db = initDb();

// ---------- helpers CSV ----------

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(field); field = "";
    } else field += ch;
  }
  fields.push(field);
  return fields;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const rec = {};
    header.forEach((col, i) => { rec[col] = values[i] ?? ""; });
    return rec;
  });
}

// ---------- helpers leitura de arquivos ----------

async function readOptional(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function findFile(folder, pattern) {
  let files;
  try { files = await fs.readdir(folder); } catch { return null; }
  const found = files.find(
    (f) => f.startsWith(pattern) && f.endsWith(".md")
  );
  return found ? await readOptional(path.join(folder, found)) : null;
}

// ---------- conversão para documento Firestore ----------

function toTimestamp(unixSeconds) {
  if (!unixSeconds || unixSeconds === 0) return null;
  return admin.firestore.Timestamp.fromMillis(Number(unixSeconds) * 1000);
}

function buildDocument({ schoolId, accountName, perfil, posts, analyses }) {
  const followerCount = Number(perfil.followerCount) || 0;

  const postDocs = posts
    .filter((p) => p.shortcode)
    .map((p) => ({
      shortcode: p.shortcode,
      url: p.url || "",
      type: p.type || "image",
      publishedAt: toTimestamp(p.timestamp),
      caption: p.caption || "",
      likes: Number(p.likes) || 0,
      comments: Number(p.comments) || 0,
      views: p.views !== "" && p.views !== null ? Number(p.views) : null,
      engagementRate: Number(p.engagement_rate) || 0,
    }));

  const totalPosts = postDocs.length;
  const avgEngagementRate =
    totalPosts > 0
      ? Math.round(
          (postDocs.reduce((s, p) => s + p.engagementRate, 0) / totalPosts) *
            10000
        ) / 10000
      : 0;

  const postsByType = postDocs.reduce(
    (acc, p) => { acc[p.type] = (acc[p.type] || 0) + 1; return acc; },
    {}
  );

  const avgLikes =
    totalPosts > 0
      ? Math.round(postDocs.reduce((s, p) => s + p.likes, 0) / totalPosts)
      : 0;
  const avgComments =
    totalPosts > 0
      ? Math.round(postDocs.reduce((s, p) => s + p.comments, 0) / totalPosts)
      : 0;

  const timestamps = postDocs
    .map((p) => p.publishedAt?.toMillis?.() || 0)
    .filter(Boolean);
  const periodStart =
    timestamps.length > 0
      ? admin.firestore.Timestamp.fromMillis(Math.min(...timestamps))
      : null;
  const periodEnd =
    timestamps.length > 0
      ? admin.firestore.Timestamp.fromMillis(Math.max(...timestamps))
      : null;

  return {
    schoolId,
    accountName,
    analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
    period: { start: periodStart, end: periodEnd },
    followerCount,
    profileName: perfil.fullName || "",
    biography: perfil.biography || "",
    summary: {
      totalPosts,
      avgEngagementRate,
      postsByType,
      avgLikes,
      avgComments,
    },
    posts: postDocs,
    qualitativeAnalysis: {
      ganchos: analyses.ganchos,
      retencao: analyses.retencao,
      storytelling: analyses.storytelling,
      vocabulario: analyses.vocabulario,
      engajamento: analyses.engajamento,
      perfilEscola: analyses.perfilEscola,
    },
  };
}

// ---------- MCP ----------

const server = new McpServer({
  name: "firestore-export",
  version: "1.0.0",
});

server.registerTool(
  "exportar_analise_escola",
  {
    title: "Exportar análise de Instagram de escola para o Firestore",
    description:
      "Lê lista.csv, perfil.json e arquivos .md de análise de uma pasta e " +
      "grava na subcoleção `escolas/{schoolId}/socialMediaAnalyses` do " +
      "Firestore (maestro4edu). Requer workspace-key.json na raiz do projeto.",
    inputSchema: {
      schoolId: z
        .string()
        .min(1)
        .describe("ID da escola no maestro4edu."),
      accountName: z
        .string()
        .min(1)
        .describe("Nome de usuário (@) do Instagram da escola."),
      pastaAnalise: z
        .string()
        .min(1)
        .describe(
          "Caminho absoluto da pasta com lista.csv, perfil.json e arquivos .md de análise."
        ),
    },
  },
  async ({ schoolId, accountName, pastaAnalise }) => {
    try {
      // Lê dados coletados
      const csvText = await fs.readFile(
        path.join(pastaAnalise, "lista.csv"),
        "utf8"
      );
      const perfilText = await fs.readFile(
        path.join(pastaAnalise, "perfil.json"),
        "utf8"
      );
      const posts = parseCsv(csvText);
      const perfil = JSON.parse(perfilText);

      // Lê análises qualitativas (todas opcionais)
      const analyses = {
        ganchos: await readOptional(
          path.join(pastaAnalise, "ig-analise-ganchos.md")
        ),
        retencao: await readOptional(
          path.join(pastaAnalise, "ig-analise-retencao.md")
        ),
        storytelling: await readOptional(
          path.join(pastaAnalise, "ig-analise-storytelling.md")
        ),
        vocabulario: await readOptional(
          path.join(pastaAnalise, "ig-analise-vocabulario.md")
        ),
        engajamento: await readOptional(
          path.join(pastaAnalise, "ig-analise-engajamento.md")
        ),
        perfilEscola: await findFile(pastaAnalise, "perfil-escola-"),
      };

      const doc = buildDocument({
        schoolId,
        accountName: accountName.replace(/^@/, ""),
        perfil,
        posts,
        analyses,
      });

      const ref = await db
        .collection("escolas")
        .doc(schoolId)
        .collection("socialMediaAnalyses")
        .add(doc);

      return {
        content: [
          {
            type: "text",
            text:
              `Análise exportada com sucesso!\n` +
              `schoolId: ${schoolId}\n` +
              `accountName: @${accountName.replace(/^@/, "")}\n` +
              `Documento Firestore: escolas/${schoolId}/socialMediaAnalyses/${ref.id}\n` +
              `Posts exportados: ${doc.summary.totalPosts}\n` +
              `Engajamento médio: ${doc.summary.avgEngagementRate}%\n` +
              `Análises qualitativas incluídas: ${
                Object.entries(analyses)
                  .filter(([, v]) => v !== null)
                  .map(([k]) => k)
                  .join(", ") || "nenhuma"
              }`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Falha ao exportar análise: ${err.message}\n\nStack: ${err.stack}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("firestore-export MCP rodando em stdio.");
