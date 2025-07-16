// FIL: api/process-job.js
import { kv } from '@vercel/kv';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium';

export const config = { 
  runtime: 'nodejs', 
  maxDuration: 300 
};

puppeteer.use(StealthPlugin());

export default async function handler(req, res) {
  // Security: Check internal API key
  if (req.headers['x-internal-api-key'] !== process.env.SCRAPER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.body;
  
  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }

  let browser = null;
  
  try {
    // Get job from database with consistent key naming
    let job = await kv.get(`job:${jobId}`);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update job status
    job.status = 'PROCESSING';
    job.progress = 'Starter browser...';
    await kv.set(`job:${jobId}`, job);

    // Launch browser
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    
    const page = await browser.newPage();
    
    // Set reasonable timeouts and user agent
    await page.setDefaultTimeout(45000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Update progress
    job.progress = 'Finder links...';
    await kv.set(`job:${jobId}`, job);
    
    // Navigate to start URL and find links
    await page.goto(job.startUrl, { waitUntil: 'networkidle2' });
    
    const links = await page.evaluate((filter) => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const hrefs = anchors.map(a => a.href);
      const filtered = hrefs.filter(href => href.includes(filter));
      return [...new Set(filtered)]; // Remove duplicates
    }, job.filter);
    
    job.totalLinks = links.length;
    job.processedLinks = 0;
    await kv.set(`job:${jobId}`, job);
    
    let allTextContent = '';

    // Process each link
    for (const link of links) {
      job.progress = `Scraper link ${job.processedLinks + 1} af ${job.totalLinks}`;
      await kv.set(`job:${jobId}`, job);
      
      try {
        await page.goto(link, { waitUntil: 'networkidle2', timeout: 45000 });
        
        // Extract text content
        const text = await page.evaluate(() => {
          // Remove unwanted elements
          const elementsToRemove = document.querySelectorAll('script, style, nav, footer, header, aside, .advertisement, .ads');
          elementsToRemove.forEach(el => el.remove());
          
          // Get clean text content
          return document.body.innerText || document.body.textContent || '';
        });
        
        allTextContent += `==========\nKILDE: ${link}\n==========\n\n${text.trim()}\n\n\n`;
        
      } catch (linkError) {
        console.error(`Error processing link ${link}:`, linkError);
        allTextContent += `==========\nKILDE: ${link}\n==========\n\nFEJL: Kunne ikke hente indhold. ${linkError.message}\n\n\n`;
      }
      
      job.processedLinks++;
      
      // Update progress every 5 links to avoid too many database writes
      if (job.processedLinks % 5 === 0) {
        await kv.set(`job:${jobId}`, job);
      }
    }

    // Job completed successfully
    job.status = 'COMPLETED';
    job.progress = 'Færdig';
    job.result = allTextContent;
    job.completedAt = new Date().toISOString();
    await kv.set(`job:${jobId}`, job);
    
    res.status(200).json({ success: true, message: 'Job completed successfully' });
    
  } catch (error) {
    console.error('Error in process-job.js:', error);
    
    // Update job status to failed
    try {
      const job = await kv.get(`job:${jobId}`);
      if (job) {
        job.status = 'FAILED';
        job.error = error.message;
        job.failedAt = new Date().toISOString();
        await kv.set(`job:${jobId}`, job);
      }
    } catch (dbError) {
      console.error('Error updating job status:', dbError);
    }
    
    res.status(500).json({ 
      error: 'Processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
    
  } finally {
    // Always close browser
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
}
