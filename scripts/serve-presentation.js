const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4040;
const PRESENTATION_DIR = path.join(__dirname, '..', 'presentation');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    const filePath = path.join(PRESENTATION_DIR, reqPath);
    const resolvedPath = path.resolve(filePath);

    // Prevent path traversal
    if (!resolvedPath.startsWith(path.resolve(PRESENTATION_DIR))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(resolvedPath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        const ext = path.extname(resolvedPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n  Presentation running at: http://localhost:${PORT}\n`);
});
