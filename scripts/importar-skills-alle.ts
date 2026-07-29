/**
 * Importa as skills de negócio da Alle (arquivos SKILL.md do Claude) para o
 * catálogo de skills do CRM. Idempotente: reimportar cria versão nova e move o ponteiro.
 * Run: npx tsx scripts/importar-skills-alle.ts
 */
import pg from "pg";
import * as fs from "node:fs";
import * as path from "node:path";

import { insertSkillVersion, setSkillPointer } from "../lib/agent-engine/agent/skills";

const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const env: Record<string, string> = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]!] = m[2]!.replace(/^"(.*)"$/, "$1");
}

const ORG_ID = "a444e4cb-b0c1-456c-821a-d15f74f9140d";
const SKILLS_DIR = "/Users/allessandracastrodesinisgalli/Desktop/alle-ai-empresa/.claude/skills";

function readSkillBody(dir: string): { description: string; body: string } {
  const raw = fs.readFileSync(path.join(SKILLS_DIR, dir, "SKILL.md"), "utf8");
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  let description = dir;
  if (fm) {
    const d = fm[1]!.match(/description:\s*(.+)/);
    if (d) description = d[1]!.trim().slice(0, 500);
  }
  const body = fm ? raw.slice(fm[0].length).trim() : raw.trim();
  return { description, body };
}

const IMPORTS = [
  {
    dir: "ia-club-marketing",
    name: "ofertas-ia-club",
    matcher: {
      any_keywords: [
        "preço", "preco", "valor", "quanto custa", "quanto é", "assinar",
        "ia club", "iaclub", "comunidade", "mentoria", "plano", "anual",
        "mensal", "garantia", "cancelar", "hotmart", "discord",
      ],
    },
  },
  {
    dir: "humanizar-texto",
    name: "tom-de-voz-alle",
    matcher: {
      any_keywords: [
        "legenda", "post", "texto", "conteúdo", "conteudo", "escrever",
        "mensagem pronta", "copy", "reescreve", "caption",
      ],
    },
  },
];

async function main() {
  const db = new pg.Pool({ connectionString: env.SUPABASE_DB_URL });
  for (const s of IMPORTS) {
    const { description, body } = readSkillBody(s.dir);
    const version = await insertSkillVersion(db, {
      tenantId: ORG_ID,
      name: s.name,
      description,
      body,
      matcher: s.matcher,
      manifest: [],
    });
    await setSkillPointer(db, { tenantId: ORG_ID, name: s.name, versionId: version.id });
    console.log(`skill instalada: ${s.name} (versão ${version.id})`);
  }
  await db.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
