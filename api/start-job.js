// FIL: api/start-job.js
import { kv } from '@vercel/kv';
import { randomUUID } from 'crypto';

export const config = {
  runtime: 'nodejs',
};

// Middleware til at håndtere CORS
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Tillad alle domæner
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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

  const { url, filter } = req.body;

  // Input-validering
  if (!url || !filter) {
    return res.status(400).json({ error: 'URL and filter are required' });
  }
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const jobId = randomUUID();
  const job = {
    id: jobId,
    status: 'PENDING',
    url,
    filter,
    createdAt: new Date().toISOString(),
  };

  await kv.set(`job:${jobId}`, job, { ex: 86400 }); // Gem job i 24 timer

  // RETTELSE: Brug den offentlige URL til at starte processen for at sikre pålidelighed.
  const publicUrl = `https://${process.env.VERCEL_URL.includes('localhost') ? 'localhost:3000' : process.env.VERCEL_URL}`;
  const processUrl = `${publicUrl}/api/process-job`;
  
  fetch(processUrl, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'X-Internal-API-Key': process.env.SCRAPER_API_KEY // Intern nøgle
    },
    body: JSON.stringify({ jobId }),
  });

  return res.status(202).json({ jobId });
}

export default allowCors(handler);
