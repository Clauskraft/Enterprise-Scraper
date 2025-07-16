// FIL: api/job-status.js
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'nodejs',
};

// Middleware to handle CORS
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-API-Key, Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  return await fn(req, res);
};

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Check API key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.SCRAPER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Valid API key required' });
  }
  
  const { jobId } = req.query;
  
  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }

  try {
    // Get job from database with consistent key naming
    const job = await kv.get(`job:${jobId}`);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Return job data, but don't include full result until job is completed
    // This saves bandwidth for large results
    const response = { ...job };
    
    if (job.status !== 'COMPLETED') {
      // Remove result field for non-completed jobs to save bandwidth
      delete response.result;
    }

    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Error in job-status.js:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}

export default allowCors(handler);
