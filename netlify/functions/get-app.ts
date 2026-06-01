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

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const id = event.queryStringParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing id query parameter" }),
      };
    }

    const store = getStore("apps");
    const project = await store.get(id, { type: "json" });

    if (project === null) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "App not found" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(project),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to retrieve app" }),
    };
  }
};
