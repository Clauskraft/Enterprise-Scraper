// FIL: api/job-status.js
import { kv } from '@vercel/kv';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.headers['x-api-key'] !== process.env.SCRAPER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { jobId } = req.query;
  if (!jobId) { return res.status(400).json({ error: 'jobId is required' }); }
  const job = await kv.get(`job:${jobId}`);
  if (!job) { return res.status(404).json({ error: 'Job not found' }); }
  
  const response = { ...job };
  if (job.status !== 'COMPLETED') { delete response.result; }
  return res.status(200).json(response);
}

