// FIL: api/start-job.js
import { kv } from '@vercel/kv';
import { randomUUID } from 'crypto';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  if (req.headers['x-api-key'] !== process.env.SCRAPER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { url, filter } = req.body;
  if (!url || !filter) { return res.status(400).json({ error: 'URL and filter are required' }); }
  try { new URL(url); } catch (e) { return res.status(400).json({ error: 'Invalid URL format' }); }

  const jobId = randomUUID();
  const job = { id: jobId, status: 'PENDING', url, filter, createdAt: new Date().toISOString() };
  await kv.set(`job:${jobId}`, job, { ex: 86400 });

  const processUrl = `${process.env.VERCEL_URL}/api/process-job`;
  fetch(processUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-API-Key': process.env.SCRAPER_API_KEY },
    body: JSON.stringify({ jobId }),
  });

  return res.status(202).json({ jobId });
}

