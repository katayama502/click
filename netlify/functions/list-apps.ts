import { getStore } from "@netlify/blobs";
import type { Handler, HandlerEvent } from "@netlify/functions";

interface AppSummary {
  id: string;
  name: string;
  createdAt: string;
}

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const store = getStore("published-apps");
    const { blobs } = await store.list();

    const apps: AppSummary[] = [];

    for (const blob of blobs) {
      try {
        const data = await store.get(blob.key, { type: "json" }) as {
          id: string;
          name: string;
          createdAt: string;
        } | null;

        if (data) {
          apps.push({
            id: data.id || blob.key,
            name: data.name || "Untitled App",
            createdAt: data.createdAt || new Date().toISOString(),
          });
        }
      } catch {
        // Skip entries that fail to parse
      }
    }

    // Sort by most recently created first
    apps.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(apps),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to list apps" }),
    };
  }
};
