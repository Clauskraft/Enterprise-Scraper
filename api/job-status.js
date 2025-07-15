// FIL: api/job-status.js
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'nodejs',
};

// Middleware til at håndtere CORS
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Tillad alle domæner
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-API-KEY, Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

async function handler(req, res) {
  // Sikkerhed: Tjek API-nøgle
  if (req.headers['x-api-key'] !== process.env.SCRAPER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { jobId } = req.query;
  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }

  const job = await kv.get(`job:${jobId}`);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Returner ikke det fulde resultat, før jobbet er færdigt, for at spare båndbredde
  const response = { ...job };
  if (job.status !== 'COMPLETED') {
    delete response.result;
  }

  return res.status(200).json(response);
}

export default allowCors(handler);
