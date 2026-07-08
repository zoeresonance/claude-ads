const GITHUB_OWNER = "zoeresonance";
const GITHUB_REPO = "claude-ads";
const GITHUB_BRANCH = "main";

function encodePath(repoPath: string): string {
  return repoPath.split("/").map(encodeURIComponent).join("/");
}

async function githubApi(path: string, init?: RequestInit): Promise<Response> {
  const token = process.env.GITHUB_CLIENTS_TOKEN;
  if (!token) throw new Error("GITHUB_CLIENTS_TOKEN is not configured.");
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
}

export function githubConfigured(): boolean {
  return !!process.env.GITHUB_CLIENTS_TOKEN;
}

export async function githubFileExists(repoPath: string): Promise<boolean> {
  const res = await githubApi(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodePath(repoPath)}?ref=${GITHUB_BRANCH}`
  );
  return res.status === 200;
}

export async function commitFileToGithub(repoPath: string, content: string, message: string): Promise<void> {
  const res = await githubApi(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodePath(repoPath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: GITHUB_BRANCH,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub commit failed for ${repoPath}: ${res.status} ${body}`);
  }
}
