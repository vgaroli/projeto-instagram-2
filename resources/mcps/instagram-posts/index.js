#!/usr/bin/env node
// MCP server: coleta todos os posts (imagens, vídeos, carrosséis) dos últimos
// N dias de uma conta pública do Instagram e salva em
// resources/posts/<conta>/lista.csv + perfil.json.
import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { fetchAccountPosts } from "./src/instagram.js";
import { readExisting, mergePosts, writeCsv } from "./src/csv.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base de saída: <raiz-do-projeto>/resources/posts
const OUTPUT_BASE =
  process.env.OUTPUT_DIR || path.resolve(__dirname, "..", "..", "posts");

function csvPathFor(username) {
  return path.join(OUTPUT_BASE, username, "lista.csv");
}

function perfilPathFor(username) {
  return path.join(OUTPUT_BASE, username, "perfil.json");
}

async function runForAccount(username, daysBack, maxPages) {
  const logs = [];
  const onLog = (m) => logs.push(m);

  const result = await fetchAccountPosts(username, { daysBack, maxPages, onLog });

  // Salva lista.csv
  const csvPath = csvPathFor(username);
  const existing = await readExisting(csvPath);
  const { merged, added, updated } = mergePosts(existing, result.posts);
  await writeCsv(csvPath, merged);

  // Salva perfil.json com dados do perfil + metadados da coleta
  const perfilPath = perfilPathFor(username);
  const perfil = {
    username,
    userId: result.userId,
    fullName: result.fullName,
    biography: result.biography,
    followerCount: result.followerCount,
    followingCount: result.followingCount,
    totalMedia: result.totalMedia,
    fetchedAt: new Date().toISOString(),
    daysBackColetados: daysBack,
  };
  await fs.mkdir(path.dirname(perfilPath), { recursive: true });
  await fs.writeFile(perfilPath, JSON.stringify(perfil, null, 2), "utf8");

  return {
    username,
    followerCount: result.followerCount,
    postsColetadosNestaExecucao: result.posts.length,
    novosAdicionados: added,
    atualizados: updated,
    totalNoArquivo: merged.length,
    paginasPercorridas: result.pagesFetched,
    erros: result.errors,
    arquivoCsv: csvPath,
    arquivoPerfil: perfilPath,
    logs,
  };
}

const server = new McpServer({
  name: "instagram-posts",
  version: "1.0.0",
});

server.registerTool(
  "fetch_account_posts",
  {
    title: "Coletar todos os posts de uma conta do Instagram (últimos N dias)",
    description:
      "Acessa a API pública do Instagram e coleta TODOS os posts (imagens, vídeos " +
      "e carrosséis) dos últimos N dias de uma conta pública. Calcula a taxa de " +
      "engajamento (curtidas + comentários / seguidores × 100) para cada post. " +
      "Salva resources/posts/<conta>/lista.csv e perfil.json.",
    inputSchema: {
      username: z
        .string()
        .min(1)
        .describe("Nome de usuário (@) da conta pública do Instagram."),
      daysBack: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Quantos dias para trás coletar (padrão: 30)."),
      maxPages: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Limite opcional de páginas a percorrer (padrão: todas)."),
    },
  },
  async ({ username, daysBack, maxPages }) => {
    const clean = String(username).trim().replace(/^@/, "");
    try {
      const summary = await runForAccount(
        clean,
        daysBack ?? 30,
        maxPages ?? Infinity
      );
      return {
        content: [
          {
            type: "text",
            text:
              `Conta @${summary.username} (${summary.followerCount ?? "?"} seguidores): ` +
              `${summary.postsColetadosNestaExecucao} posts coletados ` +
              `(${summary.novosAdicionados} novos, ${summary.atualizados} atualizados). ` +
              `Total no arquivo: ${summary.totalNoArquivo}. ` +
              `Páginas: ${summary.paginasPercorridas}. ` +
              `Erros: ${summary.erros.length}.\n` +
              `CSV: ${summary.arquivoCsv}\n` +
              `Perfil: ${summary.arquivoPerfil}\n\n` +
              JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Falha ao coletar posts de @${clean}: ${err.message}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("instagram-posts MCP rodando em stdio.");
