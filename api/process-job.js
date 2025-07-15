// FIL: api/process-job.js
import { kv } from '@vercel/kv';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium';

export const config = { runtime: 'nodejs', maxDuration: 300 };
puppeteer.use(StealthPlugin());

export default async function handler(req, res) {
  if (req.headers['x-internal-api-key'] !== process.env.SCRAPER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { jobId } = req.body;
  let browser = null;
  try {
    let job = await kv.get(`job:${jobId}`);
    job.status = 'PROCESSING';
    job.progress = 'Starter browser...';
    await kv.set(`job:${jobId}`, job);

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    
    job.progress = 'Finder links...';
    await kv.set(`job:${jobId}`, job);
    await page.goto(job.url, { waitUntil: 'networkidle2' });
    const links = [...new Set(await page.evaluate(filter => Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(href => href.includes(filter)), job.filter))];
    
    job.totalLinks = links.length;
    job.processedLinks = 0;
    let allTextContent = '';

    for (const link of links) {
      job.progress = `Scraper link ${job.processedLinks + 1} af ${job.totalLinks}`;
      await kv.set(`job:${jobId}`, job);
      try {
        await page.goto(link, { waitUntil: 'networkidle2', timeout: 45000 });
        const text = await page.evaluate(() => {
          document.querySelectorAll('script, style, nav, footer, header, aside').forEach(el => el.remove());
          return document.body.innerText;
        });
        allTextContent += `==========\nKILDE: ${link}\n==========\n\n${text}\n\n\n`;
      } catch (e) { allTextContent += `==========\nKILDE: ${link}\n==========\n\nFEJL: Kunne ikke hente indhold.\n\n\n`; }
      job.processedLinks++;
    }

    job.status = 'COMPLETED';
    job.progress = 'Færdig';
    job.result = allTextContent;
    await kv.set(`job:${jobId}`, job);
    res.status(200).json({ success: true });
  } catch (error) {
    const job = await kv.get(`job:${jobId}`);
    if (job) {
      job.status = 'FAILED';
      job.error = error.message;
      await kv.set(`job:${jobId}`, job);
    }
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
}
