import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MemoOp } from "@memohub/protocol";
import { createKernel } from "./index.js";

export async function startMcpServer(): Promise<void> {
  const kernel = await createKernel();
  const server = new McpServer({ name: "memohub", version: "3.0.0" });

  server.tool(
    "query_knowledge",
    { query: z.string(), limit: z.number().optional() },
    async (params: any) => {
      const result = await kernel.dispatch({
        op: MemoOp.RETRIEVE,
        trackId: "track-insight",
        payload: { query: params.query, limit: params.limit ?? 5 },
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "add_knowledge",
    {
      text: z.string(),
      category: z.string().optional(),
      importance: z.number().optional(),
      tags: z.array(z.string()).optional(),
    },
    async (params: any) => {
      const result = await kernel.dispatch({
        op: MemoOp.ADD,
        trackId: "track-insight",
        payload: params,
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "search_code",
    { query: z.string(), limit: z.number().optional() },
    async (params: any) => {
      const result = await kernel.dispatch({
        op: MemoOp.RETRIEVE,
        trackId: "track-source",
        payload: { query: params.query, limit: params.limit ?? 5 },
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "add_code",
    {
      code: z.string(),
      language: z.string().optional(),
      file_path: z.string().optional(),
    },
    async (params: any) => {
      const result = await kernel.dispatch({
        op: MemoOp.ADD,
        trackId: "track-source",
        payload: params,
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.tool("list_categories", {}, async () => {
    const result = await kernel.dispatch({
      op: MemoOp.LIST,
      trackId: "track-insight",
      payload: {},
    });
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });

  server.tool(
    "delete_knowledge",
    { ids: z.array(z.string()).optional(), category: z.string().optional() },
    async (params: any) => {
      const result = await kernel.dispatch({
        op: MemoOp.DELETE,
        trackId: "track-insight",
        payload: params,
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.tool("get_stats", {}, async () => {
    const categories = await kernel.dispatch({
      op: MemoOp.LIST,
      trackId: "track-insight",
      payload: {},
    });
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { tracks: kernel.listTracks(), insight: categories.data },
            null,
            2,
          ),
        },
      ],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
