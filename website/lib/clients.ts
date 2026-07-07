import fs from "fs";
import path from "path";

export interface ClientConfig {
  id: string;
  name: string;
  adAccountId?: string;
  facebookPageId: string;
  instagramAccountId: string;
  auditDoc: string;
  auditDocPath: string;
  clientDir: string;
}

const CLIENTS_DIR = path.join(process.cwd(), "clients");

function normalizeAccountId(accountId: string): string {
  return accountId.startsWith("act_") ? accountId : `act_${accountId}`;
}

function loadClients(): ClientConfig[] {
  const clients: ClientConfig[] = [];
  if (!fs.existsSync(CLIENTS_DIR)) return clients;

  for (const entry of fs.readdirSync(CLIENTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const configPath = path.join(CLIENTS_DIR, entry.name, "config.json");
    if (!fs.existsSync(configPath)) continue;

    try {
      const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const clientDir = path.join(CLIENTS_DIR, entry.name);
      const config: ClientConfig = {
        ...raw,
        id: entry.name,
        adAccountId: raw.adAccountId?.trim() ? raw.adAccountId.trim() : undefined,
        clientDir,
        auditDocPath: path.join(clientDir, raw.auditDoc ?? "audit.md"),
      };
      clients.push(config);
    } catch {
      // malformed config — skip
    }
  }
  return clients;
}

export function getAllClients(): ClientConfig[] {
  return loadClients().sort((a, b) => a.name.localeCompare(b.name));
}

export function getClientById(id: string): ClientConfig | null {
  return loadClients().find((c) => c.id === id) ?? null;
}

export function getClientForAccount(accountId: string): ClientConfig | null {
  const normalized = normalizeAccountId(accountId);
  return (
    loadClients().find((c) => c.adAccountId && normalizeAccountId(c.adAccountId) === normalized) ?? null
  );
}

export function readAuditDoc(config: ClientConfig): string {
  if (!fs.existsSync(config.auditDocPath)) return "";
  return fs.readFileSync(config.auditDocPath, "utf8");
}
