interface AuthConfig {
  token: string;
  apiBase: string;
}

interface ServerError {
  error?: string;
  issues?: Array<{ path: string; message: string }>;
  allowed?: string[];
}

async function parseJson<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") ?? "";
  const raw = await res.text().catch(() => "");
  if (!ct.toLowerCase().includes("json")) {
    throw new Error(
      `Server returned non-JSON (status ${res.status}): ${raw.slice(0, 200)}`,
    );
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      `Server returned non-JSON (status ${res.status}): ${raw.slice(0, 200)}`,
    );
  }
}

async function throwServerError(res: Response): Promise<never> {
  const ct = res.headers.get("content-type") ?? "";
  const raw = await res.text().catch(() => "");
  if (!ct.toLowerCase().includes("json")) {
    throw new Error(
      `Server returned non-JSON (status ${res.status}): ${raw.slice(0, 200)}`,
    );
  }
  let body: ServerError = {};
  try {
    body = JSON.parse(raw) as ServerError;
  } catch {
    // fall through with empty body
  }
  let msg = body.error ?? res.statusText;
  if (body.issues?.length) {
    msg +=
      "\n" +
      body.issues
        .map((i) => `  - ${i.path || "(root)"}: ${i.message}`)
        .join("\n");
  }
  if (body.allowed?.length) {
    msg += `\n  Allowed: ${body.allowed.join(", ")}`;
  }
  throw new Error(msg);
}

// Some hosted AI agents (Claude Code Cloud, ChatGPT Code Interpreter)
// run inside sandboxes whose egress proxy denies arbitrary hosts and
// returns 403 with `x-deny-reason: host_not_allowed` BEFORE the request
// reaches our server. Surface this clearly instead of letting it look
// like an auth failure.
function checkEgressBlock(cfg: AuthConfig, res: Response): void {
  if (res.status !== 403) return;
  const denyReason = res.headers.get("x-deny-reason");
  if (denyReason !== "host_not_allowed") return;
  throw new Error(
    `Sandbox blocked egress to ${cfg.apiBase} (x-deny-reason: host_not_allowed).\n` +
      `This environment cannot reach cv-pro. Workarounds:\n` +
      `  • Run from local Claude Code (CLI on your own machine)\n` +
      `  • Use claude.ai with a Custom Connector → https://cv.ha7ch.com/api/mcp\n` +
      `  • Ask the agent host to allowlist cv.ha7ch.com`,
  );
}

async function req(
  cfg: AuthConfig,
  path: string,
  opts: RequestInit = {},
): Promise<Response> {
  const url = `${cfg.apiBase}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Authorization": `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  checkEgressBlock(cfg, res);
  return res;
}

export async function register(
  handle: string,
  apiBase: string,
): Promise<{ handle: string; token: string }> {
  const url = `${apiBase}/api/register`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle }),
  });
  checkEgressBlock({ token: "", apiBase }, res);
  const data = await parseJson<{ handle?: string; token?: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return { handle: data.handle!, token: data.token! };
}

export type WhoamiResult =
  | { ok: true; username: string }
  | { ok: false; reason: "no-resume" | "unauthorized" | "error" };

export async function whoami(cfg: AuthConfig): Promise<WhoamiResult> {
  const res = await req(cfg, "/api/v1/resume");
  if (res.status === 404) return { ok: false, reason: "no-resume" };
  if (res.status === 401 || res.status === 403) {
    return { ok: false, reason: "unauthorized" };
  }
  if (!res.ok) return { ok: false, reason: "error" };
  const data = await parseJson<{ username: string }>(res);
  return { ok: true, username: data.username };
}

export async function getResume(cfg: AuthConfig) {
  const res = await req(cfg, "/api/v1/resume");
  if (!res.ok) await throwServerError(res);
  return parseJson(res);
}

export async function putResume(cfg: AuthConfig, data: unknown): Promise<{ username?: string }> {
  const res = await req(cfg, "/api/v1/resume", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) await throwServerError(res);
  return parseJson(res);
}

export async function patchSection(
  cfg: AuthConfig,
  section: string,
  value: unknown,
): Promise<{ username?: string }> {
  const res = await req(cfg, "/api/v1/resume", {
    method: "PATCH",
    body: JSON.stringify({ section, value }),
  });
  if (!res.ok) await throwServerError(res);
  return parseJson(res);
}

export async function getSchema(apiBase: string): Promise<{ json: unknown; text: string }> {
  const res = await fetch(`${apiBase}/api/v1/schema`);
  checkEgressBlock({ token: "", apiBase }, res);
  if (!res.ok) await throwServerError(res);
  return parseJson<{ json: unknown; text: string }>(res);
}

export async function listVariants(cfg: AuthConfig): Promise<{ audience: string; updatedAt: string }[]> {
  const res = await req(cfg, "/api/v1/variants");
  if (!res.ok) await throwServerError(res);
  return parseJson<{ audience: string; updatedAt: string }[]>(res);
}

export async function getVariant(cfg: AuthConfig, audience: string): Promise<unknown> {
  const res = await req(cfg, `/api/v1/variants/${encodeURIComponent(audience)}`);
  if (!res.ok) await throwServerError(res);
  return parseJson(res);
}

export async function putVariant(
  cfg: AuthConfig,
  audience: string,
  data: unknown,
): Promise<{ username?: string }> {
  const res = await req(cfg, `/api/v1/variants/${encodeURIComponent(audience)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) await throwServerError(res);
  return parseJson<{ username?: string }>(res);
}

export async function deleteVariant(cfg: AuthConfig, audience: string): Promise<void> {
  const res = await req(cfg, `/api/v1/variants/${encodeURIComponent(audience)}`, {
    method: "DELETE",
  });
  if (!res.ok) await throwServerError(res);
}
