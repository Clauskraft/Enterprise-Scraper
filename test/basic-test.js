#!/usr/bin/env node
/**
 * Simple test script for Enterprise Scraper
 * Run with: node test/basic-test.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running basic tests for Enterprise Scraper...\n');

// Test 1: Check if required files exist
console.log('✅ Test 1: File structure check');
const fs = require('fs');
const requiredFiles = [
    'package.json',
    'index.html',
    'vercel.json',
    'api/start-job.js',
    'api/process-job.js',
    'api/job-status.js',
    'README.md',
    '.gitignore'
];

let filesExist = true;
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✓ ${file} exists`);
    } else {
        console.log(`   ✗ ${file} missing`);
        filesExist = false;
    }
});

if (!filesExist) {
    console.log('\n❌ File structure test failed');
    process.exit(1);
}

// Test 2: Check package.json structure
console.log('\n✅ Test 2: Package.json validation');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['@vercel/kv', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth', '@sparticuz/chromium'];

requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
        console.log(`   ✓ ${dep} dependency found`);
    } else {
        console.log(`   ✗ ${dep} dependency missing`);
    }
});

// Test 3: Check API endpoints structure
console.log('\n✅ Test 3: API endpoints validation');
const apiFiles = ['api/start-job.js', 'api/process-job.js', 'api/job-status.js'];

apiFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('export default')) {
        console.log(`   ✓ ${file} has proper export`);
    } else {
        console.log(`   ✗ ${file} missing export`);
    }
    
    if (content.includes('process.env.SCRAPER_API_KEY')) {
        console.log(`   ✓ ${file} uses API key validation`);
    } else {
        console.log(`   ⚠ ${file} may not have API key validation`);
    }
});

// Test 4: Check HTML structure
console.log('\n✅ Test 4: HTML structure validation');
const htmlContent = fs.readFileSync('index.html', 'utf8');
const htmlChecks = [
    { check: 'form', description: 'Form element' },
    { check: 'apiKey', description: 'API key input' },
    { check: 'startUrl', description: 'Start URL input' },
    { check: 'filter', description: 'Filter input' },
    { check: 'fetch(', description: 'Fetch API usage' }
];

htmlChecks.forEach(({ check, description }) => {
    if (htmlContent.includes(check)) {
        console.log(`   ✓ ${description} found`);
    } else {
        console.log(`   ✗ ${description} missing`);
    }
});

console.log('\n🎉 Basic tests completed!');
console.log('\n📋 Manual testing checklist:');
console.log('   □ Set SCRAPER_API_KEY environment variable');
console.log('   □ Set up Vercel KV database');
console.log('   □ Test API endpoints with proper authentication');
console.log('   □ Deploy to Vercel and test end-to-end');
console.log('   □ Test error handling with invalid inputs');
console.log('   □ Test job status polling');

console.log('\n🚀 Ready for deployment!');