import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAllClients } from "@/lib/clients";

const CLIENTS_DIR = path.join(process.cwd(), "clients");

export async function GET() {
  const clients = getAllClients().map((c) => ({
    id: c.id,
    name: c.name,
    adAccountId: c.adAccountId,
  }));
  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  try {
    const { name, adAccountId, facebookPageId, instagramAccountId, auditDoc } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 });
    }

    // Sanitize name to a safe directory name (letters, numbers, spaces, hyphens, underscores only)
    const safeName = name.trim().replace(/[^a-zA-Z0-9 _-]/g, "").trim();
    if (!safeName) {
      return NextResponse.json({ error: "Client name contains no valid characters." }, { status: 400 });
    }

    const clientDir = path.join(CLIENTS_DIR, safeName);

    // Prevent path traversal — ensure the resolved path stays inside CLIENTS_DIR
    if (!clientDir.startsWith(CLIENTS_DIR + path.sep) && clientDir !== CLIENTS_DIR) {
      return NextResponse.json({ error: "Invalid client name." }, { status: 400 });
    }

    if (fs.existsSync(clientDir)) {
      return NextResponse.json({ error: `A client named "${safeName}" already exists.` }, { status: 409 });
    }

    fs.mkdirSync(clientDir, { recursive: true });

    const config: Record<string, string> = {
      name: safeName,
      auditDoc: "audit.md",
    };
    if (typeof adAccountId === "string" && adAccountId.trim()) config.adAccountId = adAccountId.trim();
    if (facebookPageId?.trim()) config.facebookPageId = facebookPageId.trim();
    if (instagramAccountId?.trim()) config.instagramAccountId = instagramAccountId.trim();

    fs.writeFileSync(path.join(clientDir, "config.json"), JSON.stringify(config, null, 2));

    if (auditDoc?.trim()) {
      fs.writeFileSync(path.join(clientDir, "audit.md"), auditDoc.trim());
    } else {
      // Create an empty placeholder so the file exists
      fs.writeFileSync(path.join(clientDir, "audit.md"), `# ${safeName} — Audience & Persona Audit\n\nAdd your persona document here.\n`);
    }

    return NextResponse.json({ success: true, id: safeName, name: safeName, adAccountId: config.adAccountId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create client: ${msg}` }, { status: 500 });
  }
}
