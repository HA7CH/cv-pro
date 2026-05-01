interface AuthConfig {
  token: string;
  apiBase: string;
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
  const data = await res.json() as { handle?: string; token?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return { handle: data.handle!, token: data.token! };
}

export async function whoami(cfg: AuthConfig): Promise<{ username: string } | null> {
  const res = await req(cfg, "/api/v1/resume");
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return { username: data.username };
}

export async function getResume(cfg: AuthConfig) {
  const res = await req(cfg, "/api/v1/resume");
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error);
  }
  return res.json();
}

export async function putResume(cfg: AuthConfig, data: unknown) {
  const res = await req(cfg, "/api/v1/resume", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error);
  }
  return res.json();
}

export async function patchSection(
  cfg: AuthConfig,
  section: string,
  value: unknown,
) {
  const res = await req(cfg, "/api/v1/resume", {
    method: "PATCH",
    body: JSON.stringify({ section, value }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error);
  }
  return res.json();
}
