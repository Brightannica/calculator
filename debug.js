const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Start a simple HTTP server
const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.wasm': 'application/wasm',
        '.pck': 'application/octet-stream',
        '.png': 'image/png',
        '.css': 'text/css'
    };
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(content);
    });
});

server.listen(8080, async () => {
    console.log('Server running on http://localhost:8080');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    
    const page = await browser.newPage();
    
    // Capture all console messages
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`[${type.toUpperCase()}] ${text}`);
    });
    
    page.on('pageerror', error => {
        console.log('[PAGE ERROR]', error.message);
    });
    
    try {
        console.log('Navigating to page...');
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle0', timeout: 60000 });
        console.log('Page loaded');
        
        // Wait a bit more for any async operations
        await new Promise(r => setTimeout(r, 10000));
        
        // Get canvas info
        const canvasInfo = await page.evaluate(() => {
            const canvas = document.getElementById('canvas');
            return {
                width: canvas.width,
                height: canvas.height,
                clientWidth: canvas.clientWidth,
                clientHeight: canvas.clientHeight,
                style: canvas.style.cssText
            };
        });
        console.log('Canvas info:', canvasInfo);
        
    } catch (err) {
        console.error('Error:', err.message);
    }
    
    await browser.close();
    server.close();
    process.exit(0);
});