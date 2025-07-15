// api/start-job.js

export default async function handler(req, res) {
  // Sæt CORS-headers for at tillade anmodninger fra alle oprindelser.
  // Dette er vigtigt for API'er, der kaldes fra en browser.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Vercel håndterer automatisk OPTIONS-anmodninger, men det er god praksis at have det med.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Sørg for, at vi kun accepterer POST-anmodninger.
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Brug en try...catch-blok til at fange alle fejl.
  try {
    // 1. Hent data fra anmodningens krop (body).
    const { startUrl, filter, apiKey } = req.body;

    // Simpel validering for at sikre, at de nødvendige data er til stede.
    if (!startUrl || !filter || !apiKey) {
      return res.status(400).json({ error: 'Mangler påkrævede parametre: startUrl, filter, eller apiKey' });
    }

    // --- Her ville din logik til at starte det faktiske job være ---
    // F.eks. et kald til en ekstern service, en database-opdatering osv.
    // For nu simulerer vi, at et job startes, og genererer et unikt job-ID.
    console.log(`Starter job med URL: ${startUrl} og filter: ${filter}`);
    const jobId = `job_${Date.now()}`;
    // --- Slut på din job-logik ---

    // 2. Hvis alt går godt, send et succes-svar tilbage med det nye job-ID.
    console.log(`Job startet succesfuldt med ID: ${jobId}`);
    return res.status(200).json({ jobId: jobId });

  } catch (error) {
    // 3. Hvis der opstår en fejl i try-blokken, fanges den her.
    // Log den fulde fejl til Vercel-loggen for nemmere debugging.
    console.error('Fejl i start-job.js:', error);

    // Send et generisk, men gyldigt, JSON-fejlsvar tilbage til browseren.
    return res.status(500).json({ 
      error: 'Der opstod en intern serverfejl.',
      details: error.message // Inkluder detaljer for bedre fejlfinding på klientsiden.
    });
  }
}