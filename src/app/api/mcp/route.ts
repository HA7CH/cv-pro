import { NextRequest, NextResponse } from "next/server";
import { verifyPat } from "@/lib/pat";
import { TOOLS, dispatchTool } from "@/lib/mcp/tools";

const SERVER_INFO = {
  name: "cv",
  version: "0.1.0",
};

const PROTOCOL_VERSION = "2025-06-18";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}
function rpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: unknown,
) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, data } };
}

async function authenticate(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return verifyPat(token);
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json(
      { error: "unauthorized", message: "Bearer token missing or invalid." },
      {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer" },
      },
    );
  }

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = (await req.json()) as JsonRpcRequest | JsonRpcRequest[];
  } catch {
    return NextResponse.json(
      rpcError(null, -32700, "Parse error"),
      { status: 400 },
    );
  }

  const requests = Array.isArray(body) ? body : [body];
  const responses = await Promise.all(
    requests.map((r) => handle(r, auth.username)),
  );

  const filtered = responses.filter((r) => r !== null);
  if (filtered.length === 0) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(Array.isArray(body) ? filtered : filtered[0]);
}

export async function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}

async function handle(req: JsonRpcRequest, username: string) {
  const { id, method, params } = req;

  if (req.jsonrpc !== "2.0") {
    return rpcError(id, -32600, "Invalid Request");
  }

  if (id === undefined && method !== "notifications/initialized") {
    return rpcError(id, -32600, "Invalid Request: missing id");
  }

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    case "notifications/initialized":
      return null;

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, { tools: TOOLS });

    case "tools/call": {
      const name = String((params as { name?: string } | undefined)?.name ?? "");
      const args =
        ((params as { arguments?: Record<string, unknown> } | undefined)
          ?.arguments as Record<string, unknown>) ?? {};
      const result = await dispatchTool(name, args, { username });
      return rpcResult(id, result);
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
