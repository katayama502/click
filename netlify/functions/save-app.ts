import { getStore } from "@netlify/blobs";
import type { Handler, HandlerEvent } from "@netlify/functions";

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { id, project } = JSON.parse(event.body || "{}");

    if (!id || !project) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing id or project" }),
      };
    }

    const store = getStore("apps");
    await store.setJSON(id, project);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to save app" }),
    };
  }
};
