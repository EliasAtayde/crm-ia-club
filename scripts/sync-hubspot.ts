/**
 * Sincroniza contatos novos do HubSpot para o CRM (fonte "Leads HubSpot").
 * Roda em loop pelo Iniciar CRM.command (a cada 5 min) quando HUBSPOT_PRIVATE_TOKEN
 * está no .env.local. Cursor em .hubspot-sync-cursor (gitignored) evita duplicar.
 * Token: HubSpot → Settings → Integrations → Private Apps → criar app com
 * escopo crm.objects.contacts.read → colar o token no .env.local.
 * Run: npx tsx scripts/sync-hubspot.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";

const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const env: Record<string, string> = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]!] = m[2]!.replace(/^"(.*)"$/, "$1");
}

const TOKEN = env.HUBSPOT_PRIVATE_TOKEN;
const CAPTURE_URL = "http://localhost:3000/api/v1/webhooks/in/xF7HBWl14BrhJOcrz2rDWeC68Q8B8oce";
const CURSOR_FILE = path.join(process.cwd(), ".hubspot-sync-cursor");

if (!TOKEN) {
  console.log("HUBSPOT_PRIVATE_TOKEN ausente no .env.local — sync pulado.");
  process.exit(0);
}

async function main() {
  const since = fs.existsSync(CURSOR_FILE)
    ? fs.readFileSync(CURSOR_FILE, "utf8").trim()
    : new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      filterGroups: [
        { filters: [{ propertyName: "createdate", operator: "GT", value: since }] },
      ],
      sorts: [{ propertyName: "createdate", direction: "ASCENDING" }],
      properties: ["firstname", "lastname", "email", "phone", "lifecyclestage", "createdate"],
      limit: 100,
    }),
  });
  if (!res.ok) throw new Error(`HubSpot ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    results: Array<{ id: string; properties: Record<string, string | null> }>;
  };

  let imported = 0;
  let lastCreate = since;
  for (const c of data.results) {
    const p = c.properties;
    const nome = [p.firstname, p.lastname].filter(Boolean).join(" ") || p.email || `Contato ${c.id}`;
    const r = await fetch(CAPTURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        email: p.email ?? undefined,
        telefone: p.phone ?? undefined,
        etapa_hubspot: p.lifecyclestage ?? undefined,
        hubspot_id: c.id,
      }),
    });
    if (r.ok) imported++;
    if (p.createdate && p.createdate > lastCreate) lastCreate = p.createdate;
    await new Promise((ok) => setTimeout(ok, 1100)); // respeita o rate limit da captação
  }
  if (data.results.length > 0) fs.writeFileSync(CURSOR_FILE, lastCreate);
  console.log(`sync: ${imported} lead(s) novo(s) importado(s) (desde ${since}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
