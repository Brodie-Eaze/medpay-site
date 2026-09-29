/* MedPay — static host.
   Zero dependencies. Brotli/gzip for text, long-lived immutable caching for the
   versioned assets, conditional requests, byte ranges for the film, clean URLs
   for the legal pages. */
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');

const root = __dirname, port = process.env.PORT || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json'
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest']);
const PAGES = { '/': 'index.html', '/privacy': 'privacy.html', '/terms': 'terms.html' };
const ROOT_FILES = { '/robots.txt': 'assets/robots.txt', '/sitemap.xml': 'assets/sitemap.xml', '/favicon.ico': 'assets/img/favicon-32.png' };

const cache = new Map();   // file -> {buf, br, gz, etag, mtime, size, type}

function load(file) {
  const hit = cache.get(file);
  const stat = fs.statSync(file);
  if (hit && hit.mtime === stat.mtimeMs) return hit;
  const ext = path.extname(file).toLowerCase();
  const entry = { mtime: stat.mtimeMs, size: stat.size, type: TYPES[ext] || 'application/octet-stream' };
  if (COMPRESSIBLE.has(ext) && stat.size < 4 * 1024 * 1024) {
    entry.buf = fs.readFileSync(file);
    entry.etag = '"' + crypto.createHash('sha1').update(entry.buf).digest('base64').slice(0, 22) + '"';
    entry.br = zlib.brotliCompressSync(entry.buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } });
    entry.gz = zlib.gzipSync(entry.buf, { level: 9 });
  } else {
    entry.etag = '"' + stat.size.toString(36) + '-' + Math.round(stat.mtimeMs).toString(36) + '"';
  }
  cache.set(file, entry);
  return entry;
}

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Practice inquiries: validate, then forward to the GHL inbound webhook (GHL_WEBHOOK_URL).
// Nothing is stored here. If GHL is unset or fails, the visitor is told to email instead.
const hits = new Map();   // ip -> [timestamps]
// ponytail: in-memory per-instance rate limit, move to Redis if this runs on >1 replica
const FIELDS = { name: 120, business: 160, email: 160, phone: 40, businessType: 80, revenue: 40, message: 1500, website: 200 };
function clean(v, max) { return typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : ''; }
function inquiry(req, res) {
  const json = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...SECURITY }); res.end(JSON.stringify(body)); };
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < 3600e3);
  if (recent.length >= 5) return json(429, { error: 'Too many requests' });
  hits.set(ip, [...recent, now]);
  if (hits.size > 5000) hits.clear();
  let raw = '';
  req.on('data', c => { raw += c; if (raw.length > 10240) req.destroy(); });
  req.on('end', async () => {
    let d; try { d = JSON.parse(raw); } catch { return json(400, { error: 'Bad request' }); }
    const f = {}; for (const k in FIELDS) f[k] = clean(d[k], FIELDS[k]);
    if (f.website) return json(200, { ok: true });   // honeypot
    if (!f.name || !f.business || !f.businessType || !f.revenue
      || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email) || f.phone.replace(/\D/g, '').length < 10)
      return json(422, { error: 'Missing or invalid fields' });
    const url = process.env.GHL_WEBHOOK_URL;
    if (!url) { console.error('inquiry: GHL_WEBHOOK_URL not set'); return json(503, { error: 'Unavailable' }); }
    const [first, ...rest] = f.name.split(/\s+/);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ first_name: first, last_name: rest.join(' '), full_name: f.name, email: f.email, phone: f.phone,
          company_name: f.business, business_type: f.businessType, monthly_revenue: f.revenue, message: f.message,
          source: 'MedPay website inquiry', submitted_at: new Date().toISOString() }) });
      if (!r.ok) throw new Error('GHL ' + r.status);
      json(200, { ok: true });
    } catch (e) { console.error('inquiry forward failed:', e.message); json(502, { error: 'Unavailable' }); }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/inquiry') return inquiry(req, res);
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  let pathname, query = '';
  try {
    const i = req.url.indexOf('?');
    query = i === -1 ? '' : req.url.slice(i + 1);
    pathname = decodeURIComponent(i === -1 ? req.url : req.url.slice(0, i));
  } catch { res.writeHead(400).end('Bad request'); return; }
  if (pathname.includes('\0')) { res.writeHead(400).end('Bad request'); return; }

  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  const page = PAGES[pathname] || PAGES[pathname.replace(/\.html$/, '')];
  const rootFile = ROOT_FILES[pathname];
  const rel = page || rootFile || pathname.replace(/^\//, '');

  const file = path.resolve(root, rel);
  const relative = path.relative(root, file);
  const allowed = relative === 'index.html' || relative === 'privacy.html' || relative === 'terms.html'
    || relative.startsWith('assets' + path.sep);
  if (relative.startsWith('..') || path.isAbsolute(relative) || !allowed) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY });
    res.end('<!doctype html><meta charset="utf-8"><title>Not found · MedPay</title>'
      + '<body style="font:16px/1.6 system-ui;padding:60px;color:#13343B;background:#F4F8F8">'
      + '<p>That page does not exist. <a href="/" style="color:#0F766E">Back to MedPay</a>.</p>');
    return;
  }

  let entry;
  try { entry = load(file); } catch { res.writeHead(404, SECURITY).end('Not found'); return; }

  const versioned = /(^|&)b=/.test(query) && !page;
  const headers = {
    'Content-Type': entry.type,
    'Cache-Control': page ? 'public, max-age=0, must-revalidate'
      : versioned ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600',
    ETag: entry.etag,
    'Last-Modified': new Date(entry.mtime).toUTCString(),
    Vary: 'Accept-Encoding',
    ...SECURITY
  };

  const inm = req.headers['if-none-match'];
  if (inm && inm.split(',').some(t => t.trim() === entry.etag)) { res.writeHead(304, headers); res.end(); return; }

  // text: serve the precompressed copy
  if (entry.buf) {
    const accept = req.headers['accept-encoding'] || '';
    let body = entry.buf;
    if (/\bbr\b/.test(accept)) { body = entry.br; headers['Content-Encoding'] = 'br'; }
    else if (/\bgzip\b/.test(accept)) { body = entry.gz; headers['Content-Encoding'] = 'gzip'; }
    headers['Content-Length'] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
    return;
  }

  // binary: stream, with ranges for the film
  headers['Accept-Ranges'] = 'bytes';
  let start = 0, end = entry.size - 1, status = 200;
  if (req.headers.range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!m || (!m[1] && !m[2])) { res.writeHead(416, { 'Content-Range': `bytes */${entry.size}`, ...SECURITY }); res.end(); return; }
    if (!m[1]) start = Math.max(0, entry.size - Number(m[2]));
    else { start = Number(m[1]); if (m[2]) end = Math.min(end, Number(m[2])); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= entry.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${entry.size}`, ...SECURITY }); res.end(); return;
    }
    status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${entry.size}`;
  }
  headers['Content-Length'] = Math.max(0, end - start + 1);
  res.writeHead(status, headers);
  if (req.method === 'HEAD' || entry.size === 0) { res.end(); return; }
  const stream = fs.createReadStream(file, { start, end });
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
});

if (require.main === module) server.listen(port, () => console.log('MedPay ready on ' + port));
module.exports = server;
