# Enterprise Scraper

A secure, asynchronous web scraper built for Vercel with a Danish interface.

## Features

- **Asynchronous Processing**: Jobs run in background with status tracking
- **Secure API**: API key-based authentication
- **Scalable**: Built on Vercel serverless infrastructure
- **User-Friendly**: Clean web interface with progress tracking
- **Robust**: Error handling and retry mechanisms

## Architecture

- **Frontend**: Static HTML with vanilla JavaScript
- **Backend**: Vercel serverless functions
- **Database**: Vercel KV (Redis) for job storage
- **Scraping**: Puppeteer with stealth plugin

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - `SCRAPER_API_KEY`: Your API key for authentication
   - `KV_REST_API_URL`: Vercel KV REST API URL
   - `KV_REST_API_TOKEN`: Vercel KV REST API token

4. Deploy to Vercel:
   ```bash
   npx vercel
   ```

## API Endpoints

### POST /api/start-job
Starts a new scraping job.

**Request:**
```json
{
  "apiKey": "your-api-key",
  "startUrl": "https://example.com",
  "filter": "/specific-path/"
}
```

**Response:**
```json
{
  "jobId": "job_1234567890"
}
```

### GET /api/job-status?jobId=job_1234567890
Gets job status and results.

**Headers:**
- `X-API-Key`: Your API key

**Response:**
```json
{
  "id": "job_1234567890",
  "status": "COMPLETED",
  "progress": "Færdig",
  "startUrl": "https://example.com",
  "filter": "/specific-path/",
  "totalLinks": 10,
  "processedLinks": 10,
  "result": "scraped content..."
}
```

### POST /api/process-job
Internal endpoint for processing jobs (called automatically).

## Security Considerations

- API keys are required for all operations
- Rate limiting should be implemented
- Input validation is performed
- CORS headers are properly configured

## Development

1. Install dependencies: `npm install`
2. Run locally: `vercel dev`
3. Test endpoints using provided examples

## Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull request

## License

ISC License - see package.json for details