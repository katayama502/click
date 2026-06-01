import { NextRequest, NextResponse } from 'next/server';
import { AppProject } from '@/lib/types';

// In-memory store for development. Replace with a real database (e.g., Supabase, PlanetScale)
// when deploying outside of Netlify (where Netlify Blobs is the preferred solution).
declare global {
  // eslint-disable-next-line no-var
  var __appStore: Map<string, AppProject> | undefined;
}

const appStore: Map<string, AppProject> =
  global.__appStore ?? (global.__appStore = new Map<string, AppProject>());

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, project }: { id: string; project: AppProject } = body;

    if (!id || !project) {
      return NextResponse.json(
        { error: 'Missing id or project' },
        { status: 400 }
      );
    }

    appStore.set(id, {
      ...project,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save app' },
      { status: 500 }
    );
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
