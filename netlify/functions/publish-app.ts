import { getStore } from "@netlify/blobs";
import type { Handler, HandlerEvent } from "@netlify/functions";
import type { AppProject } from "../../lib/types";

interface PublishRequestBody {
  project: AppProject;
  appName?: string;
}

interface PublishedAppMetadata {
  id: string;
  name: string;
  createdAt: string;
  project: AppProject;
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body: PublishRequestBody = JSON.parse(event.body || "{}");
    const { project, appName } = body;

    if (!project) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing project data" }),
      };
    }

    const publishedId = crypto.randomUUID().slice(0, 8);
    const createdAt = new Date().toISOString();
    const name = appName || project.name || "Untitled App";

    const siteUrl =
      process.env.URL ||
      process.env.DEPLOY_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://your-site.netlify.app";

    const publishedData: PublishedAppMetadata = {
      id: publishedId,
      name,
      createdAt,
      project: {
        ...project,
        publishedId,
        updatedAt: createdAt,
      },
    };

    const store = getStore("published-apps");
    await store.setJSON(publishedId, publishedData);

    const url = `${siteUrl}/published/${publishedId}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        publishedId,
        url,
        name,
        createdAt,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to publish app" }),
    };
  }
};
