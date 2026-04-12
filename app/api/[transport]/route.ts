import { createMcpHandler } from "@vercel/mcp-adapter";
import { registerTools } from "../../../src/registerTools";

// Prevent Next.js from pre-rendering this route at build time.
// The redashClient requires REDASH_URL/REDASH_API_KEY env vars which
// are only available at runtime, not during the build step.
export const dynamic = "force-dynamic";

const mcpHandler = createMcpHandler(
  (server) => {
    registerTools(server);
  },
  {
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "redash-mcp",
      version: "1.1.0",
    },
  },
  {
    basePath: "/api",
    maxDuration: 60,
  }
);

function authenticate(req: Request): Response | null {
  const token = process.env.MCP_SHARED_TOKEN;
  if (!token) return null;

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${token}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

async function handler(req: Request) {
  const denied = authenticate(req);
  if (denied) return denied;
  return mcpHandler(req);
}

export { handler as GET, handler as POST, handler as DELETE };
