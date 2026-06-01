import { NextRequest, NextResponse } from 'next/server';
import { AppProject } from '@/lib/types';

// Shares the same in-memory store written by the publish route in development.
// On Netlify, the Netlify function at /.netlify/functions/get-app handles reads
// using Netlify Blobs.
declare global {
  // eslint-disable-next-line no-var
  var __publishedAppStore: Map<string, { id: string; name: string; createdAt: string; project: AppProject }> | undefined;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const store = global.__publishedAppStore;
  if (!store) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const entry = store.get(id);
  if (!entry) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  return NextResponse.json(entry.project);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
