// Import Vercel's Key-Value store
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Set CORS headers to allow requests from all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Use try...catch block to handle all errors
  try {
    const { startUrl, filter, apiKey } = req.body;

    // Validate required parameters
    if (!startUrl || !filter || !apiKey) {
      return res.status(400).json({ 
        error: 'Mangler påkrævede parametre: startUrl, filter, eller apiKey' 
      });
    }

    // Validate API key
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return res.status(401).json({ error: 'Ugyldigt API-nøgle' });
    }

    // Validate URL format
    try {
      new URL(startUrl);
    } catch (urlError) {
      return res.status(400).json({ error: 'Ugyldig URL format' });
    }

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create job object to store in database
    const jobData = {
      id: jobId,
      status: 'PENDING',
      startUrl: startUrl,
      filter: filter,
      createdAt: new Date().toISOString(),
      progress: 'Job oprettet',
      results: [],
      totalLinks: 0,
      processedLinks: 0
    };

    // Store new job in Vercel KV database with consistent key naming
    await kv.set(`job:${jobId}`, jobData);

    // Trigger processing job (in a real implementation, this would be queued)
    // For now, we'll just return the job ID
    console.log(`Job started and stored in KV with ID: ${jobId}`);
    
    return res.status(200).json({ jobId: jobId });

  } catch (error) {
    // Handle errors gracefully
    console.error('Error in start-job.js:', error);

    // Send specific but valid JSON error response
    return res.status(500).json({ 
      error: 'Der opstod en intern serverfejl under oprettelse af job.',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

