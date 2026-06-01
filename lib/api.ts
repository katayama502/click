import { AppProject } from './types';

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || '';

export async function publishApp(project: AppProject): Promise<{ publishedId: string; url: string }> {
  // Try Netlify function first, fall back to Next.js API route
  const endpoint = `${API_BASE}/.netlify/functions/publish-app`;
  const fallback = `${API_BASE}/api/apps/publish`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
    });
    if (res.ok) return res.json();
  } catch {}

  // Fallback to Next.js API
  const res = await fetch(fallback, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project }),
  });

  if (!res.ok) throw new Error('Failed to publish');
  return res.json();
}

export async function getPublishedApp(id: string): Promise<AppProject | null> {
  const endpoint = `${API_BASE}/.netlify/functions/get-app?id=${id}`;
  const fallback = `${API_BASE}/api/apps/${id}`;

  try {
    const res = await fetch(endpoint);
    if (res.ok) return res.json();
  } catch {}

  const res = await fetch(fallback);
  if (!res.ok) return null;
  return res.json();
}

export async function saveApp(id: string, project: AppProject): Promise<void> {
  const endpoint = `${API_BASE}/.netlify/functions/save-app`;
  const fallback = `${API_BASE}/api/apps/save`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, project }),
    });
    if (res.ok) return;
  } catch {}

  await fetch(fallback, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, project }),
  });
}
