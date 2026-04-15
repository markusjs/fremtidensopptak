/**
 * Kristiania prototype dev-server
 * Rene URL-er med rewrite-regler.
 */
var http = require('http');
var fs   = require('fs');
var path = require('path');

var PORT = process.env.PORT || 3000;
var ROOT = __dirname;

/* ── MIME types ── */
var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
};

/* ── Route rewrites (canonical = no trailing slash) ── */
var REWRITES = {
  '/utdanning': '/studietilbud _ Kristiania.html',
  '/sok':       '/sok-skjema.html',
};

function handler(req, res) {
  var url = req.url.split('?')[0]; // strip query string

  /* 1) Strip trailing slash (except root) → 301 redirect */
  if (url.length > 1 && url.charAt(url.length - 1) === '/') {
    var clean = url.replace(/\/+$/, '');
    res.writeHead(301, { 'Location': clean });
    res.end();
    return;
  }

  /* 2) Check exact rewrites */
  if (REWRITES[url]) {
    return serveFile(path.join(ROOT, REWRITES[url]), res);
  }

  /* 3) Map clean path to actual file */
  var filePath = path.join(ROOT, decodeURIComponent(url));

  /* 4) If it's a directory, try index.html */
  try {
    if (fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch(e) { /* file doesn't exist yet, handled below */ }

  /* 5) If file not found, try appending .html */
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    var withHtml = filePath + '.html';
    if (fs.existsSync(withHtml)) {
      filePath = withHtml;
    }
  }

  /* 6) Serve the file */
  serveFile(filePath, res);
}

function serveFile(filePath, res) {
  fs.readFile(filePath, function(err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><html><head><title>404</title></head><body><h1>404 – Ikke funnet</h1><p>' + filePath + '</p></body></html>');
      return;
    }
    var ext = path.extname(filePath).toLowerCase();
    var contentType = MIME[ext] || (ext ? 'application/octet-stream' : 'text/plain; charset=utf-8');
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

var server = http.createServer(handler);
server.listen(PORT, function() {
  console.log('Kristiania dev-server running at http://localhost:' + PORT);
  console.log('  /utdanning  →  studietilbud _ Kristiania.html');
  console.log('  /sok        →  sok-skjema.html');
});
