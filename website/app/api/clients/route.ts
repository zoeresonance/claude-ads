import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const clientsDir = path.join(process.cwd(), "clients");
  if (!fs.existsSync(clientsDir)) {
    return NextResponse.json({ clients: [] });
  }

  const clients: { name: string; adAccountId: string }[] = [];

  for (const entry of fs.readdirSync(clientsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const configPath = path.join(clientsDir, entry.name, "config.json");
    if (!fs.existsSync(configPath)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (raw.name && raw.adAccountId) {
        clients.push({ name: raw.name, adAccountId: raw.adAccountId });
      }
    } catch {
      // malformed config — skip
    }
  }

  clients.sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ clients });
}
