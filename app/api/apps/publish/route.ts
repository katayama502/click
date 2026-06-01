import { NextRequest, NextResponse } from 'next/server';
import { AppProject } from '@/lib/types';

// In-memory store for development. On Netlify, the Netlify function at
// /.netlify/functions/publish-app handles publishing using Netlify Blobs.
declare global {
  // eslint-disable-next-line no-var
  var __publishedAppStore: Map<string, { id: string; name: string; createdAt: string; project: AppProject }> | undefined;
}

const publishedStore =
  global.__publishedAppStore ??
  (global.__publishedAppStore = new Map<
    string,
    { id: string; name: string; createdAt: string; project: AppProject }
  >());

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, appName }: { project: AppProject; appName?: string } = body;

    if (!project) {
      return NextResponse.json({ error: 'Missing project data' }, { status: 400 });
    }

    const publishedId = crypto.randomUUID().slice(0, 8);
    const createdAt = new Date().toISOString();
    const name = appName || project.name || 'Untitled App';

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const url = `${siteUrl}/published/${publishedId}`;

    publishedStore.set(publishedId, {
      id: publishedId,
      name,
      createdAt,
      project: { ...project, publishedId, updatedAt: createdAt },
    });

    return NextResponse.json({ publishedId, url, name, createdAt });
  } catch {
    return NextResponse.json({ error: 'Failed to publish app' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}
