// Importer Vercels Key-Value store.
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Sæt CORS-headers for at tillade anmodninger fra alle oprindelser.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Brug en try...catch-blok til at fange alle fejl.
  try {
    const { startUrl, filter, apiKey } = req.body;

    if (!startUrl || !filter || !apiKey) {
      return res.status(400).json({ error: 'Mangler påkrævede parametre: startUrl, filter, eller apiKey' });
    }

    // Generer et unikt job-ID.
    const jobId = `job_${Date.now()}`;

    // Opret et job-objekt, der skal gemmes i databasen.
    const jobData = {
      id: jobId,
      status: 'pending', // Starter som 'afventer'
      startUrl: startUrl,
      filter: filter,
      createdAt: new Date().toISOString(),
      results: [] // En tom liste til at gemme fundne links
    };

    // Gem det nye job i Vercel KV-databasen.
    // Nøglen er selve job-ID'et for nem opslag.
    await kv.set(jobId, jobData);

    // Hvis alt går godt, send et succes-svar tilbage med det nye job-ID.
    console.log(`Job startet og gemt i KV med ID: ${jobId}`);
    return res.status(200).json({ jobId: jobId });

  } catch (error) {
    // Hvis der opstår en fejl, fanges den her.
    console.error('Fejl i start-job.js:', error);

    // Send et specifikt, men gyldigt, JSON-fejlsvar tilbage.
    return res.status(500).json({ 
      error: 'Der opstod en intern serverfejl under oprettelse af job.',
      details: error.message
    });
  }
}

